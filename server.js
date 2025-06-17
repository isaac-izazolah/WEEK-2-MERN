const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory products data
let products = [];

// Middleware: Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware: Auth
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: API key missing or invalid' });
  }
  next();
});

// Middleware: Parse JSON
app.use(bodyParser.json());

// Root Route
app.get('/', (req, res) => res.send('Hello World'));

// Routes: CRUD for Products

// GET /api/products - list with filter & pagination
app.get('/api/products', (req, res) => {
  const { category, page = 1, limit = 10 } = req.query;
  let result = [...products];

  if (category) result = result.filter(p => p.category === category);

  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  res.json(result.slice(start, end));
});

// GET /api/products/:id
app.get('/api/products/:id', (req, res, next) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return next(new Error('Product not found'));
  res.json(product);
});

// POST /api/products
app.post('/api/products', (req, res) => {
  const { name, description, price, category, inStock } = req.body;
  if (
    !name ||
    !description ||
    typeof price !== 'number' ||
    !category ||
    typeof inStock !== 'boolean'
  ) {
    return res.status(400).json({ error: 'Validation Error: Invalid product data' });
  }

  const newProduct = { id: uuidv4(), ...req.body };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PUT /api/products/:id
app.put('/api/products/:id', (req, res, next) => {
  const { name, description, price, category, inStock } = req.body;
  if (
    !name ||
    !description ||
    typeof price !== 'number' ||
    !category ||
    typeof inStock !== 'boolean'
  ) {
    return res.status(400).json({ error: 'Validation Error: Invalid product data' });
  }

  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return next(new Error('Product not found'));

  products[index] = { id: req.params.id, ...req.body };
  res.json(products[index]);
});

// DELETE /api/products/:id
app.delete('/api/products/:id', (req, res, next) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return next(new Error('Product not found'));

  products.splice(index, 1);
  res.status(204).send();
});

// GET /api/products/search/:name
app.get('/api/products/search/:name', (req, res) => {
  const term = req.params.name.toLowerCase();
  const result = products.filter(p => p.name.toLowerCase().includes(term));
  res.json(result);
});

// GET /api/products/stats/category-count
app.get('/api/products/stats/category-count', (req, res) => {
  const stats = {};
  products.forEach(p => {
    stats[p.category] = (stats[p.category] || 0) + 1;
  });
  res.json(stats);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
