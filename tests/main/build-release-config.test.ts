// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

import forgeConfig, { squirrelNugetPackageId } from '../../forge.config';
import packageJson from '../../package.json';

describe('build and release configuration', () => {
  it('exposes the expected npm scripts and app metadata', () => {
    expect(packageJson.name).toBe('gastos-produtos-electron');
    expect(packageJson.productName).toBe('Gastos Produtos');
    expect(packageJson.description).toBe(
      'Aplicativo desktop Electron para gestao local de gastos de produtos, embalagens e receitas.',
    );
    expect(packageJson.main).toBe('.vite/build/main.js');
    expect(packageJson.scripts).toMatchObject({
      dev: 'electron-forge start',
      start: 'npm run dev',
      package: 'electron-forge package',
      make: 'electron-forge make',
      verify: 'npm run lint && npm run typecheck && npm run test',
      'release:local': 'npm run verify && electron-forge make',
      publish: 'npm run verify && electron-forge publish',
    });
  });

  it('keeps forge packaging and release makers configured', () => {
    expect(forgeConfig.packagerConfig).toMatchObject({
      asar: true,
      executableName: 'gastos-produtos',
    });

    expect(
      forgeConfig.makers?.map((maker) => ({
        name: (maker as { name: string }).name,
        platforms: (maker as { platforms: string[] }).platforms,
      })),
    ).toEqual(
      expect.arrayContaining([
        { name: 'squirrel', platforms: ['win32'] },
        { name: 'zip', platforms: ['darwin'] },
        { name: 'rpm', platforms: ['linux'] },
        { name: 'deb', platforms: ['linux'] },
      ]),
    );
  });

  it('uses a NuGet-safe Squirrel id separate from productName and npm package name', () => {
    expect(squirrelNugetPackageId).toBe('gastosprodutos');
    expect(packageJson.productName).toBe('Gastos Produtos');
    expect(packageJson.name).toBe('gastos-produtos-electron');
  });

  it('keeps vite bundling and fuse hardening configured for packaged builds', () => {
    expect(
      forgeConfig.plugins?.map((plugin) => ({
        name: (plugin as { name: string }).name,
        config: (plugin as { config?: unknown }).config,
        fusesConfig: (plugin as { fusesConfig?: unknown }).fusesConfig,
      })),
    ).toEqual(
      expect.arrayContaining([
        {
          name: 'auto-unpack-natives',
          config: {},
          fusesConfig: undefined,
        },
        {
          name: 'vite',
          config: {
            build: [
              {
                entry: 'src/main/index.ts',
                config: 'vite.main.config.ts',
                target: 'main',
              },
              {
                entry: 'src/preload/index.ts',
                config: 'vite.preload.config.ts',
                target: 'preload',
              },
            ],
            renderer: [
              {
                name: 'main_window',
                config: 'vite.renderer.config.ts',
              },
            ],
          },
          fusesConfig: undefined,
        },
        {
          name: 'fuses',
          config: {
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.OnlyLoadAppFromAsar]: true,
          },
          fusesConfig: {
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.OnlyLoadAppFromAsar]: true,
          },
        },
      ]),
    );
  });
});
