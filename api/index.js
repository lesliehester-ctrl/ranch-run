// Vercel Serverless Function — Express API for Ranch Run
const express = require("express");

const app = express();
app.use(express.json());

// ── In-memory storage ──
const products = [];
const orders = new Map();
const orderItemsMap = new Map();
let nextOrderId = 1;

// Seed products
const seedData = [
  { id:1, name:"Premium Alfalfa Hay", description:"High-protein alfalfa hay, ideal for horses and cattle. Sourced from local North Texas farms.", price:18.5, unit:"per bale", category:"Hay", inStock:1, featured:1 },
  { id:2, name:"Coastal Bermuda Hay", description:"Quality coastal bermuda grass hay, great for horses and livestock.", price:14, unit:"per bale", category:"Hay", inStock:1, featured:1 },
  { id:3, name:"Timothy Hay", description:"Soft, leafy timothy hay perfect for horses with sensitive digestion.", price:16, unit:"per bale", category:"Hay", inStock:1, featured:0 },
  { id:4, name:"Orchard Grass Hay", description:"Nutrient-rich orchard grass, excellent palatability for all equine.", price:15.5, unit:"per bale", category:"Hay", inStock:1, featured:0 },
  { id:5, name:"Bermuda Grass Hay", description:"Standard bermuda grass hay for cattle and general livestock use.", price:12, unit:"per bale", category:"Hay", inStock:1, featured:0 },
  { id:6, name:"Alfalfa/Grass Mix", description:"Blended alfalfa and grass hay, balanced nutrition profile.", price:16.5, unit:"per bale", category:"Hay", inStock:1, featured:0 },
  { id:7, name:"Round Bale - Coastal", description:"Large round bale of coastal bermuda. Approximately 1,000 lbs.", price:85, unit:"per bale", category:"Hay", inStock:1, featured:1 },
  { id:8, name:"Square Bale - Alfalfa", description:"Small square bale of premium alfalfa, easy to handle.", price:20, unit:"per bale", category:"Hay", inStock:1, featured:0 },
  { id:9, name:"Whole Oats", description:"Clean whole oats for horses. Great source of energy and fiber.", price:16, unit:"per 50 lb bag", category:"Grain", inStock:1, featured:1 },
  { id:10, name:"Crimped Oats", description:"Steam-crimped oats for improved digestibility.", price:18, unit:"per 50 lb bag", category:"Grain", inStock:1, featured:0 },
  { id:11, name:"Cracked Corn", description:"Coarsely cracked corn, a staple energy source for livestock.", price:12.5, unit:"per 50 lb bag", category:"Grain", inStock:1, featured:0 },
  { id:12, name:"Sweet Feed Mix", description:"Molasses-coated grain mix with corn, oats, and barley.", price:17.5, unit:"per 50 lb bag", category:"Grain", inStock:1, featured:0 },
  { id:13, name:"Barley", description:"Whole barley grain for cattle and horse rations.", price:15, unit:"per 50 lb bag", category:"Grain", inStock:1, featured:0 },
  { id:14, name:"Rice Bran", description:"Stabilized rice bran for weight gain and coat condition.", price:22, unit:"per 40 lb bag", category:"Grain", inStock:1, featured:0 },
  { id:15, name:"Beet Pulp Shreds", description:"Dried beet pulp shreds, excellent fiber source for horses.", price:19, unit:"per 40 lb bag", category:"Grain", inStock:1, featured:0 },
  { id:16, name:"12% Protein Horse Feed", description:"All-purpose pelleted horse feed, 12% crude protein.", price:18.5, unit:"per 50 lb bag", category:"Feed", inStock:1, featured:1 },
  { id:17, name:"14% Performance Horse Feed", description:"Higher protein feed for working and performance horses.", price:22, unit:"per 50 lb bag", category:"Feed", inStock:1, featured:0 },
  { id:18, name:"Senior Horse Feed", description:"Easily digestible feed formulated for aging horses.", price:24, unit:"per 50 lb bag", category:"Feed", inStock:1, featured:0 },
  { id:19, name:"All-Stock Feed", description:"General purpose feed suitable for cattle, goats, and sheep.", price:15, unit:"per 50 lb bag", category:"Feed", inStock:1, featured:0 },
  { id:20, name:"Cattle Range Cubes", description:"20% protein range cubes for supplemental cattle feeding.", price:14.5, unit:"per 50 lb bag", category:"Feed", inStock:1, featured:0 },
  { id:21, name:"Goat Feed Pellets", description:"Complete pelleted feed formulated for goats.", price:17, unit:"per 50 lb bag", category:"Feed", inStock:1, featured:0 },
  { id:22, name:"Chicken Layer Feed", description:"16% protein crumbles for laying hens.", price:16.5, unit:"per 50 lb bag", category:"Feed", inStock:1, featured:0 },
  { id:23, name:"Premium Dog Food", description:"Grain-free adult dog food with real chicken.", price:48, unit:"per 30 lb bag", category:"Pet", inStock:1, featured:0 },
  { id:24, name:"Cat Food - Indoor", description:"Indoor formula cat food for weight management.", price:32, unit:"per 16 lb bag", category:"Pet", inStock:1, featured:0 },
  { id:25, name:"Dog Food - Large Breed", description:"Large breed formula with joint support.", price:52, unit:"per 40 lb bag", category:"Pet", inStock:1, featured:0 },
  { id:26, name:"Rabbit Pellets", description:"Timothy-based rabbit feed pellets.", price:12, unit:"per 10 lb bag", category:"Pet", inStock:1, featured:0 },
  { id:27, name:"Electrolyte Powder", description:"Equine electrolyte supplement for hot Texas weather.", price:28, unit:"per 5 lb tub", category:"Supplements", inStock:1, featured:1 },
  { id:28, name:"Joint Supplement - Equine", description:"Glucosamine and MSM joint support for horses.", price:45, unit:"per 2.5 lb jar", category:"Supplements", inStock:1, featured:0 },
  { id:29, name:"Hoof Supplement", description:"Biotin-based hoof health supplement.", price:38, unit:"per 3 lb bag", category:"Supplements", inStock:1, featured:0 },
  { id:30, name:"Fly Spray Concentrate", description:"Concentrated permethrin fly spray, makes 5 gallons.", price:34, unit:"per bottle", category:"Supplements", inStock:1, featured:0 },
];
seedData.forEach(p => products.push(p));

const zones = [
  { id:"zone-1", name:"Zone 1", communities:"Decatur, Alvord, Boyd", distance:"0 – 10 miles", fee:15, minOrder:0 },
  { id:"zone-2", name:"Zone 2", communities:"Bridgeport, Paradise, Chico, Rhome", distance:"10 – 20 miles", fee:30, minOrder:25 },
  { id:"zone-3", name:"Zone 3", communities:"Springtown, Sunset, Runaway Bay", distance:"20 – 35 miles", fee:55, minOrder:50 },
];

// Routes
app.get("/api/products", (req, res) => {
  const { category, search } = req.query;
  let list = products;
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }
  if (category) list = list.filter(p => p.category === category);
  res.json(list);
});

app.get("/api/products/featured", (_req, res) => {
  res.json(products.filter(p => p.featured === 1));
});

app.get("/api/products/:id", (req, res) => {
  const p = products.find(x => x.id === Number(req.params.id));
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(p);
});

app.get("/api/delivery-zones", (_req, res) => {
  res.json(zones);
});

app.post("/api/orders", (req, res) => {
  try {
    const { customer, items, deliveryZone, deliveryDate, notes } = req.body;
    if (!customer || !items || !deliveryZone || !deliveryDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const zoneFees = { "zone-1":15, "zone-2":30, "zone-3":55 };
    const deliveryFee = zoneFees[deliveryZone] || 15;
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) continue;
      subtotal += product.price * item.quantity;
      orderItems.push({ productName: product.name, quantity: item.quantity, unitPrice: product.price });
    }
    const orderNumber = "RR-" + Date.now().toString(36).toUpperCase();
    const total = Math.round((subtotal + deliveryFee) * 100) / 100;
    const order = {
      id: nextOrderId++,
      orderNumber,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email || null,
      deliveryAddress: customer.address,
      deliveryZone,
      deliveryDate,
      deliveryFee,
      subtotal: Math.round(subtotal * 100) / 100,
      total,
      status: "pending",
      notes: notes || null,
    };
    orders.set(orderNumber, order);
    orderItemsMap.set(orderNumber, orderItems);
    res.json({ orderNumber, total });
  } catch (e) {
    res.status(500).json({ error: "Failed to create order" });
  }
});

app.get("/api/orders/:orderNumber", (req, res) => {
  const order = orders.get(req.params.orderNumber);
  if (!order) return res.status(404).json({ error: "Order not found" });
  const items = orderItemsMap.get(req.params.orderNumber) || [];
  res.json({ ...order, items });
});

module.exports = app;
