import { provideServerRendering, withAppShell, withRoutes } from '@angular/ssr';
import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { serverRoutes } from './app.routes.server';
import { appConfig } from './app.config';
import { AppShell } from '@shared/layout/app-shell/app-shell';

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes), withAppShell(AppShell))],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
