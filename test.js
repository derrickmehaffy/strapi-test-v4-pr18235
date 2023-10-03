const { faker } = require("@faker-js/faker");
const axios = require("axios");
const apiToken =
  "c26aa2b5e5c76e6e456009fba3d69541c8f23f4e79caec48a28735a1865ae33230fc1022282b649e433409bba475119b81b134a3d7357b8332ddd9d2431c1b4bcc080c5c1c34e563c236c83dc60488aa41072a2536a51e3c87854df247fdadcace9d7c2f1c8f4ddd2da72290e4a05ba6e7c052a9982b70ff24533c97a1c478a5";

const instance = axios.create({
  baseURL: "http://localhost:1337/api/",
  timeout: 1000,
  headers: {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  },
});

const test = async () => {
  const someImage = await fetch(faker.image.urlLoremFlickr());
  const actualURL = someImage.url;

  const formData = new FormData();
  formData.append(
    "files",
    await someImage.blob(),
    actualURL.substring(actualURL.lastIndexOf("/") + 1)
  );

  const response = await instance.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

test();
