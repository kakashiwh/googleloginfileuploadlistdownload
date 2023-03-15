import  express  from "express";
import multer from "multer";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import fs from "fs";
import { OAuth2Client } from "google-auth-library";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

const CLIENT_ID = '467303493899-gaesmk5jhp5aqbd9mtsfv4mpm9unu8cb.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

app.post("/api/login", async (req, res) => {
  try {
    const { id_token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const user = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
    };
    console.log(user);
    res.json({ success: true, email: user.email });
  } catch (error) {
    console.error(error);
    res.status(401).json({ success: false, message: "Failed to authenticate user." });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });


app.post("/api/upload", upload.single("file"), (req, res) => {
  const { user } = req.body;
  const fileName = `${user}-${Date.now()}-${req.file.originalname}`;
  const filePath = path.join(__dirname, "uploads", fileName);
  fs.rename(req.file.path, filePath, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send(err);
    } else {
      console.log(`File ${req.file.filename} uploaded by user ${user}`);
      res.send();
    }
  });
});


app.get("/api/files", (req, res) => {
  const directoryPath = path.join(__dirname, "uploads");
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).send(err);
    }
    const fileData = files.map((filename) => {
      const uploader = filename.split("-")[0];
      return { filename, uploader };
    });
    res.send(fileData);
  });
});


app.get("/api/files/:filename", (req, res) => {
  const { filename } = req.params;
  const { email } = req.query; // get email from query parameter
  const filePath = path.join(__dirname, "uploads", filename);
  
  // Check if the user is authorized to download the file
  if (email !== req.query.user) {
    return res.status(403).send("You are not authorized to download this file.");
  }

  res.download(filePath, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send(err);
    }
  });
  
});



app.listen(5000, () => {
  console.log("Server started on port 5000");
}); 
