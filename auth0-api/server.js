require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { auth } = require('express-oauth2-jwt-bearer');

const app = express();
app.use(express.json());

// allow requests from frontend
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET','POST','PUT','DELETE'],
  credentials: true
}));

const port = process.env.PORT || 4000;

// ensure required env variables are set
if (!process.env.AUTH0_DOMAIN || !process.env.AUDIENCE) {
  console.error('Missing AUTH0_DOMAIN or AUDIENCE in .env');
  process.exit(1);
}

// middleware to check JWT (RS256 via JWKS)
const checkJwt = auth({
  audience: process.env.AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
});

// public endpoint
app.get('/api/public', (req, res) => {
  res.json({ msg: 'public endpoint - no auth required' });
});

// protected endpoint - requires valid access token
app.get('/api/profile', checkJwt, (req, res) => {
  // express-oauth2-jwt-bearer puts claims in req.auth.payload
  const claims = req.auth && req.auth.payload ? req.auth.payload : {};
  res.json({
    msg: 'protected profile data',
    tokenClaims: claims
  });
});

app.get('/api/admin', checkJwt, (req, res) => {
  const roles = req.auth.payload['https://zadanie-api/roles'] || [];
  // check for admin role
  if (!roles.includes('admin')) {
    return res.status(403).json({ message: 'Access denied - admin only.' });
  }

  res.json({ secret: "This is admin only data. :D" });
});



app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});