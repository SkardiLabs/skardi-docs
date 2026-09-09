// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Skardi',
  tagline: 'An open-source self-improving context framework. Let your agent query any of your data, declaring why it asks, so the intentions that keep coming back become named tools and standing routines.',
  favicon: 'img/logo.svg',

  future: {
    v4: true,
  },

  url: 'https://skardilabs.github.io',
  baseUrl: '/skardi-docs/',

  organizationName: 'SkardiLabs',
  projectName: 'skardi-docs',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // No site-wide editUrl. It pointed at skardi/website/, a path that
          // has never existed in that repo, so every "Edit this page" link
          // 404'd. Generated pages carry their own custom_edit_url pointing at
          // the file they came from; frozen snapshots are not meant to be
          // edited and so get no link at all.
          // The site tracks main. Tagged releases stay reachable in the
          // version dropdown; main is what a visitor lands on, so the docs
          // match the README rather than the last release.
          lastVersion: 'current',
          versions: {
            current: {
              label: 'main',
              path: '',
              banner: 'none',
            },
            '0.5.0': {
              label: '0.5.0',
              // Docusaurus banners every non-latest version as "no longer
              // actively maintained". 0.5.0 is the current release — the
              // version people are actually running — so that warning would
              // be wrong. Older tags keep the default banner.
              banner: 'none',
            },
            '0.4.0': {
              label: '0.4.0',
            },
            '0.3.0': {
              label: '0.3.0',
            },
            '0.2.0': {
              label: '0.2.0',
            },
            '0.1.1': {
              label: '0.1.1',
            },
          },
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/logo.png',
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Skardi',
        logo: {
          alt: 'Skardi Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docsVersionDropdown',
            position: 'right',
          },
          {
            href: 'https://github.com/SkardiLabs/skardi',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {label: 'Getting Started', to: '/docs/intro'},
              {label: 'CLI', to: '/docs/cli'},
              {label: 'Server', to: '/docs/server'},
              {label: 'Data Sources', to: '/docs/data-sources/overview'},
            ],
          },
          {
            title: 'More',
            items: [
              {label: 'GitHub', href: 'https://github.com/SkardiLabs/skardi'},
              {label: 'Releases', href: 'https://github.com/SkardiLabs/skardi/releases'},
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} SkardiLabs. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['rust', 'bash', 'yaml', 'sql', 'json'],
      },
    }),
};

export default config;
