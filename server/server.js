const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

dotenv.config({ override: true });

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   CLOUDINARY
========================= */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* =========================
   MULTER
========================= */

const upload = multer({
  storage: multer.memoryStorage(),
});

/* =========================
   MONGODB CONNECTION
========================= */

const mongoURI =
  `mongodb://${process.env.MONGO_USER}:${encodeURIComponent(
    process.env.MONGO_PASSWORD
  )}` +
  `@${process.env.MONGO_HOST_1}:27017,` +
  `${process.env.MONGO_HOST_2}:27017,` +
  `${process.env.MONGO_HOST_3}:27017/` +
  `campusfix?authSource=admin&replicaSet=${process.env.MONGO_REPLICA_SET}&tls=true`;

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

/* =========================
   COMPLAINT SCHEMA
========================= */

const complaintSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
    },

    problemType: {
      type: String,
      required: true,
      trim: true,
    },

    block: {
      type: String,
      default: "",
      trim: true,
    },

    floor: {
      type: String,
      default: "",
      trim: true,
    },

    roomNumber: {
      type: String,
      default: "",
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    photoUrl: {
      type: String,
      default: "",
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

const Complaint = mongoose.model("Complaint", complaintSchema);

/* =========================
   HOME
========================= */

app.get("/", (req, res) => {
  res.send("CampusFix Backend is running!");
});

/* =========================
   ADMIN LOGIN
========================= */

app.post("/admin/login", (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();

  const password = String(req.body.password || "");

  const adminEmail = String(process.env.ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();

  const adminPassword = String(process.env.ADMIN_PASSWORD || "");

  if (email === adminEmail && password === adminPassword) {
    return res.json({
      success: true,
      message: "Login successful",
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid admin credentials",
  });
});

/* =========================
   CREATE COMPLAINT
========================= */

app.post("/complaints", upload.single("photo"), async (req, res) => {
  try {
    console.log("================================");
    console.log("New complaint received");
    console.log("Body:", req.body);
    console.log("Photo:", req.file ? req.file.originalname : "No photo");
    console.log("================================");

    const {
      name,
      email,
      problemType,
      block,
      floor,
      roomNumber,
      location,
      description,
      priority,
    } = req.body;

    // Required field checking
    if (
      !name ||
      !email ||
      !problemType ||
      !location ||
      !description
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please fill Name, Email, Problem Type, Location and Description.",
      });
    }

    let photoUrl = "";

    /* =========================
       OPTIONAL CLOUDINARY UPLOAD
    ========================= */

    if (req.file) {
      console.log("Uploading photo to Cloudinary...");

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "campusfix",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        stream.end(req.file.buffer);
      });

      photoUrl = uploadResult.secure_url;

      console.log("Photo uploaded successfully!");
      console.log("Photo URL:", photoUrl);
    }

    /* =========================
       SAVE COMPLAINT
    ========================= */

    const complaint = new Complaint({
      name,
      email,
      problemType,
      block: block || "",
      floor: floor || "",
      roomNumber: roomNumber || "",
      location,
      description,
      photoUrl,
      priority: priority || "Medium",
      status: "Pending",
    });

    const savedComplaint = await complaint.save();

    console.log("Complaint saved successfully!");
    console.log("Complaint ID:", savedComplaint._id);

    return res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      complaint: savedComplaint,
    });
  } catch (error) {
    console.error("================================");
    console.error("COMPLAINT SUBMISSION ERROR");
    console.error(error);
    console.error("================================");

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save complaint",
    });
  }
});

/* =========================
   GET ALL COMPLAINTS
========================= */

app.get("/complaints", async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({
      createdAt: -1,
    });

    res.json(complaints);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to load complaints",
    });
  }
});

/* =========================
   GET ONE COMPLAINT
========================= */

app.get("/complaints/:id", async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    res.json(complaint);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to find complaint",
    });
  }
});

/* =========================
   UPDATE STATUS
========================= */

app.put("/complaints/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "In Progress",
      "Resolved",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        status,
      },
      {
        new: true,
      }
    );

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    res.json({
      success: true,
      message: "Status updated successfully",
      complaint,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update status",
    });
  }
});

/* =========================
   UPDATE PRIORITY
========================= */

app.put("/complaints/:id/priority", async (req, res) => {
  try {
    const { priority } = req.body;

    const allowedPriorities = [
      "Low",
      "Medium",
      "High",
    ];

    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({
        message: "Invalid priority",
      });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        priority,
      },
      {
        new: true,
      }
    );

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    res.json({
      success: true,
      message: "Priority updated successfully",
      complaint,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update priority",
    });
  }
});

/* =========================
   ERROR HANDLER
========================= */

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(500).json({
    message: error.message || "Internal server error",
  });
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `CampusFix server running on http://localhost:${PORT}`
  );
});