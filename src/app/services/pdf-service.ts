import { Service } from '@angular/core';

const TYPST_VERSION = '0.7.0';
const COMPILER_WASM = `https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-web-compiler@${TYPST_VERSION}/pkg/typst_ts_web_compiler_bg.wasm`;
const RENDERER_WASM = `https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-renderer@${TYPST_VERSION}/pkg/typst_ts_renderer_bg.wasm`;

const DATA_PATH = '/data.json';

@Service()
export class PdfService {
  private typstPromise?: Promise<any>;

  private typst(): Promise<any> {
    if (!this.typstPromise) {
      this.typstPromise = (async () => {
        const { $typst } = await import('@myriaddreamin/typst.ts');
        $typst.setCompilerInitOptions({ getModule: () => COMPILER_WASM });
        $typst.setRendererInitOptions({ getModule: () => RENDERER_WASM });
        return $typst;
      })().catch((error) => {
        this.typstPromise = undefined;
        console.error('Could not load the Typst compiler:', error);
        throw new Error('Could not load the PDF compiler. Check your connection and try again.');
      });
    }

    return this.typstPromise;
  }

  async compilePdf(template: string, payload: unknown): Promise<Uint8Array> {
    if (!template?.trim()) {
      throw new Error('The document template is empty.');
    }

    const $typst = await this.typst();

    try {
      await $typst.resetShadow();
      await $typst.addSource(DATA_PATH, JSON.stringify(payload));

      const pdf = await $typst.pdf({ mainContent: template });

      if (!pdf?.length) {
        throw new Error('The template compiled but produced no pages.');
      }

      return pdf;
    } catch (error) {
      console.error('Typst compilation failed:', error);
      throw new Error(this.getCompileErrorMessage(error));
    } finally {
      await $typst.resetShadow();
    }
  }

  download(bytes: Uint8Array, filename: string): void {
    const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = this.safeFilename(filename);
    link.click();

    URL.revokeObjectURL(url);
  }

  safeFilename(value: string): string {
    const cleaned = value
      .replace(/[^a-z0-9\-_. ]/gi, '')
      .trim()
      .replace(/\s+/g, '-');

    return (cleaned || 'document') + (cleaned.toLowerCase().endsWith('.pdf') ? '' : '.pdf');
  }

  private getCompileErrorMessage(err: unknown): string {
    const message = String((err as { message?: string })?.message ?? '');

    if (message.includes('produced no pages') || message.includes('compiler')) {
      return message;
    }

    return `The template failed to compile. ${message}`.trim();
  }
}
