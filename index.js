const fs = require("fs");
const { randomBytes } = require("crypto");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    optionsSuccessStatus: 200,
  })
);
app.use(bodyParser.json());

const getResource = () =>
  JSON.parse(fs.readFileSync(path.join(__dirname, "data.json")));

// routes

app.get("/api/resources", (req, res) => {
  const data = getResource();
  res.json(data);
});
app.get("/api/resources/active", (req, res) => {
  const data = getResource();
  const item = data.find((i) => i.status === "active");

  res.status(item ? 200 : 204).json(item);
});

app.post("/api/resources", (req, res) => {
  const {
    body: { title, description, link, priority, timeToFinish },
  } = req;
  const data = getResource();
  let resource = {
    id: randomBytes(256).toString("hex").substr(0, 32),
    title,
    description,
    link,
    priority,
    timeToFinish,
    createdAt: new Date(),
    status: "inactive",
  };
  data.unshift(resource);
  fs.writeFileSync(
    path.join(__dirname, "data.json"),
    JSON.stringify(data, null, 2),
    (err) => {
      if (err) {
        return res
          .status(400)
          .send({ errorCode: 400, message: "Can not save data" });
      }
    }
  );
  res.json({
    success: resource,
    data,
  });
});

app.get("/api/resources/:id", (req, res) => {
  const { id } = req.params;
  const data = getResource();

  let item = data.find((i) => i.id == id);

  if (!item) {
    return res.status(204).send("");
  }
  res.json(item);
});

app.patch("/api/resources/:id", (req, res) => {
  const { id } = req.params;
  const {
    body: { title, description, link, priority, timeToFinish, status },
  } = req;
  let data = getResource();

  let index = data.findIndex((i) => i.id == id);
  const activeResource = data.find((i) => i.status === "active");

  if (index == -1) {
    return res.status(204).send("");
  }

  if (data[index].status === "complete") {
    return res.status(422).json({
      errorCode: 422,
      message: "Completed resource can not be modified",
    });
  }
  data[index] = {
    ...data[index],
    title,
    description,
    link,
    priority,
    timeToFinish,
    status,
  };
  if (status === "active") {
    if (activeResource) {
      return res
        .status(422)
        .json({ errorCode: 422, message: "There is active resource already" });
    } else {
      data[index].status = "active";
      data[index].activationDate = new Date();
    }
  }

  fs.writeFileSync(
    path.join(__dirname, "data.json"),
    JSON.stringify(data, null, 2),
    (err) => {
      if (err) {
        return res
          .status(400)
          .send({ errorCode: 400, message: "Can not save data" });
      }
    }
  );

  res.json(data[index]);
});

app.listen(process.env.PORT || 3001, () => console.log("Server is running"));
