// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://bakkenshale.com',
  redirects: {
    '/pages/healthcare': '/healthcare',
    '/pages/terms-and-conditions-of-usage': '/terms-and-conditions-of-usage',
    '/pages/counties': '/counties',
    '/pages/courthouse-directory': '/courthouse-directory',
    '/pages/contact-us': '/contact-us',
    '/pages/advertising': '/advertising',
    '/pages/about-bakkenshale-com': '/about-bakkenshale-com',
    '/pages/bakken-mineral-tax-appraisal-offices': '/bakken-mineral-tax-appraisal-offices',
    '/pages/chamber-of-commerce-directory': '/chamber-of-commerce-directory',
    '/pages/companies': '/companies',
    '/pages/geology': '/geology',
    '/pages/maps': '/maps',
    '/pages/oil-gas-jobs': '/oil-gas-jobs',
    '/pages/oilfield-services-jobs': '/oilfield-services-jobs',
    '/pages/oilfield-service-companies': '/oilfield-service-companies',
    '/pages/midstream-jobs': '/midstream-jobs',
    '/pages/pipeline-midstream-companies': '/pipeline-midstream-companies',
    '/pages/privacy-policy': '/privacy-policy',
    '/pages/archive': '/archive',
    '/pages/bsp-news': '/bsp-news',
    '/pages/bsp-jobs': '/bsp-jobs',
    '/pages/drilling': '/drilling',
    '/pages/press': '/press',
    '/pages/pmn': '/pmn',
    '/pages/events-list': '/events-list',
    '/pages/bakken-shale-oil-formation': '/bakken-shale-oil-formation',
  },
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [sitemap()]
});