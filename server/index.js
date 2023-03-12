import  express  from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import multer from "multer";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.json());
app.use(cors());

const JWT_SECRET = 'my_secret_key';

// Endpoint to handle user authentication
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;


  const userId = 1;

  // Create a JWT token with the user ID
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });

  res.json({ token });
});

// Endpoint to handle file uploads
app.post('/api/upload', upload.single('file'), (req, res) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authorization.split(' ')[1];

  try {
    // Verify the JWT token to check if the user is authenticated
    const { userId } = jwt.verify(token, JWT_SECRET);

    // Move the uploaded file to a new directory and rename it with the user ID
    const oldPath = req.file.path;
    const newPath = `uploads/${userId}-${req.file.originalname}`;
    fs.renameSync(oldPath, newPath);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(403).json({ error: 'Forbidden' });
  }
});

// Endpoint to handle file list retrieval
app.get('/api/list', (req, res) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authorization.split(' ')[1];

  try {
    // Verify the JWT token to check if the user is authenticated
    const { userId } = jwt.verify(token, JWT_SECRET);

    // Read the files in the uploads directory and filter by the user ID
    const files = fs.readdirSync('uploads/');
    const userFiles = files.filter((file) => file.startsWith(`${userId}-`));

    res.json(userFiles);
  } catch (error) {
    console.error(error);
    res.status(403).json({ error: 'Forbidden' });
  }
});

app.get("/api/list/:filename", (req, res) => {
  const{ authorization } = req.headers;
  if(!authorization)
  {
    return res.status(401).json({error:'Unauthorized'});
  }

  const token = authorization.split(' ')[1];
  try {
    const { userId } = jwt.verify(token,JWT_SECRET);

  const filePath = path.join(__dirname, "uploads/", req.params.filename);
  res.json(filePath);
  } catch (error) {
    console.error(error);
    res.status(403).json({error : 'Forbidden'});
  }
  
});

app.listen(3001, () => {
  console.log('Server listening on port 3001');
});