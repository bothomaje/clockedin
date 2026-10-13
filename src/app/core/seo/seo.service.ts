import { DOCUMENT } from '@angular/common';
import { Service, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { SEO_SITE_URL, SeoRouteData } from './seo.config';

const DEFAULT_SEO: SeoRouteData = {
  title: 'clockedin | Job Application and Career Tracker',
  description:
    'Organise your job search with clockedin. Track applications and interviews, explore opportunities and prepare career documents.',
  robots: 'noindex, nofollow',
  canonical: false,
};

@Service()
export class SeoService {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  constructor() {
    this.applyRouteMetadata();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.applyRouteMetadata());
  }

  private applyRouteMetadata(): void {
    const routeSeo = this.findSeoData(this.router.routerState.snapshot.root) ?? DEFAULT_SEO;
    const robots = routeSeo.robots ?? 'index, follow';

    this.title.setTitle(routeSeo.title);
    this.meta.updateTag({ name: 'description', content: routeSeo.description });
    this.meta.updateTag({ name: 'robots', content: robots });

    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: routeSeo.title });
    this.meta.updateTag({ property: 'og:description', content: routeSeo.description });
    this.meta.updateTag({ property: 'og:image', content: this.getSocialImageUrl(routeSeo.image) });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: routeSeo.title });
    this.meta.updateTag({ name: 'twitter:description', content: routeSeo.description });
    this.meta.updateTag({ name: 'twitter:image', content: this.getSocialImageUrl(routeSeo.image) });

    if (this.shouldHaveCanonical(routeSeo, robots)) {
      const canonicalUrl = this.getCanonicalUrl();
      this.setCanonicalUrl(canonicalUrl);
      this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    } else {
      this.removeCanonicalUrl();
      this.meta.removeTag('property="og:url"');
    }
  }

  private findSeoData(route: ActivatedRouteSnapshot): SeoRouteData | undefined {
    let current: ActivatedRouteSnapshot | null = route;
    let matchedSeo: SeoRouteData | undefined;

    while (current) {
      const configuredSeo = current.data['seo'] as SeoRouteData | undefined;
      if (configuredSeo) matchedSeo = configuredSeo;
      current = current.firstChild;
    }

    return matchedSeo;
  }

  private shouldHaveCanonical(seo: SeoRouteData, robots: string): boolean {
    return seo.canonical !== false && /(?:^|,)\s*index\s*(?:,|$)/i.test(robots);
  }

  private getSocialImageUrl(image?: string): string {
    try {
      return new URL(image ?? '/clockedin-preview-transparent.png', SEO_SITE_URL).toString();
    } catch {
      return image ?? '/clockedin-preview-transparent.png';
    }
  }

  private getCanonicalUrl(): string {
    const routePath = (this.router.url.split(/[?#]/, 1)[0] || '/').replace(/\/+$/, '') || '/';

    try {
      const origin = new URL(SEO_SITE_URL);
      return new URL(routePath, origin).toString();
    } catch {
      return SEO_SITE_URL;
    }
  }

  private setCanonicalUrl(href: string): void {
    let canonical = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.rel = 'canonical';
      this.document.head.appendChild(canonical);
    }

    canonical.href = href;
  }

  private removeCanonicalUrl(): void {
    this.document.head.querySelector('link[rel="canonical"]')?.remove();
  }
}
