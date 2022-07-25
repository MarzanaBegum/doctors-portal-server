const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const fs = require("fs-extra");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const uri = `${process.env.MONGODB_CONNECTION_STRING}`;

const app = express();


app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload());
app.use(express.static("doctors"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

client.connect((err) => {
  const appointmentsCollection = client
    .db("doctors-portal")
    .collection("appointments");
  const usersCollection = client.db("doctors-portal").collection("users");
  const doctorsCollection = client.db("doctors-portal").collection("doctors");

  //add appointment
  app.post("/addAppointment", (req, res) => {
    const appointment = req.body;
    appointmentsCollection.insertOne(appointment).then((results) => {
      res.send(results.insertedId !== "");
    });
  });

  //get appointments
  app.get("/appointments", (req, res) => {
    appointmentsCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
  //find appointmentsByDate
  app.post("/appointmentsByDate", (req, res) => {
    const date = req.body;
    const email = req.body.email;
    doctorsCollection
      .find({ email: email })
      .toArray((err, docotorsDocument) => {
        const filter = { date: date.date };
        if (docotorsDocument.length === 0) {
          filter.email = email;
        }

        appointmentsCollection.find(filter).toArray((err, documents) => {
          res.send(documents);
        });
      });
  });

  // user
  app.post("/user", (req, res) => {
    const user = req.body;
    usersCollection.insertOne(user).then((results) => {
      res.send(results.insertedId !== "");
    });
  });

  //add doctor
  app.post("/addDoctor", (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const file = req.files.image;

    const newImg = file.data;
    const encImg = newImg.toString("base64");
    var img = {
      contentType: file.mimetype,
      size: file.size,
      image: Buffer.from(encImg, "base64"),
    };
    doctorsCollection.insertOne({ name, email, img }).then((results) => {
      res.send(results.insertedId !== "");
    });
  });

  //get doctor
  app.get("/doctors", (req, res) => {
    doctorsCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  app.post("/isDoctor", (req, res) => {
    const email = req.body.email;
    doctorsCollection.find({ email: email }).toArray((err, doctor) => {
      console.log(doctor)
      res.send(doctor.length > 0);
    });
  });
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Example app listening on port ${process.env.PORT}`);
});
