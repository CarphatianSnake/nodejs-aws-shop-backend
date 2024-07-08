import path = require('node:path');

export const ORIGINS = ['https://d3ffym298mm09d.cloudfront.net', 'http://localhost:3000'];

export const ALLOWED_HEADERS = ['Content-Type', 'Authorization', 'Access-Control-Allow-Methods', 'Access-Control-Allow-Origin'];

export const LAYERS_PATH = path.join('src', 'layers');

const SERVICES = path.join('services');

export const SERVICES_PATH = {
  Products: path.join(SERVICES, 'products'),
  Import: path.join(SERVICES, 'import'),
  Authorization: path.join(SERVICES, 'authorization'),
};

export const API_PATHS = {
  Products: '/products',
  Import: '/import',
};
