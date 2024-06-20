import path = require('node:path');

export const ORIGINS = ['https://d3ffym298mm09d.cloudfront.net', 'https://localhost:3000'];

export const ALLOWED_HEADERS = ['Content-Type', 'Authorization', 'Access-Control-Allow-Methods', 'Access-Control-Allow-Origin'];

export const LAYERS_PATH = path.join('src', 'layers');

const SERVICES_PATH_BASE = path.join('src', 'services');

export const SERVICES_PATH = {
  Products: path.join(SERVICES_PATH_BASE, 'products'),
  Import: path.join(SERVICES_PATH_BASE, 'import'),
};

export const API_PATHS = {
  Products: '/products',
  Import: '/import',
};
