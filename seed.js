const { faker } = require("@faker-js/faker");
const axios = require("axios");

const apiToken =
  "c26aa2b5e5c76e6e456009fba3d69541c8f23f4e79caec48a28735a1865ae33230fc1022282b649e433409bba475119b81b134a3d7357b8332ddd9d2431c1b4bcc080c5c1c34e563c236c83dc60488aa41072a2536a51e3c87854df247fdadcace9d7c2f1c8f4ddd2da72290e4a05ba6e7c052a9982b70ff24533c97a1c478a5";
const entriesCount = 1000;
const relationsCount = 100;
const imageRelationsCount = 5;
const timeout = 1000; // in ms

const instance = axios.create({
  baseURL: "http://localhost:1337/api/",
  timeout: timeout,
  headers: {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  },
});

const contentTypes = [
  {
    name: "blog-posts",
    api: "api::blog-post.blog-post",
    structure: {
      title: "title",
      slug: "slug",
      body: "body",
      heroImage: "image",
      assets: "images",
      categories: "relation",
    },
  },
  {
    name: "categories",
    api: "api::category.category",
    structure: {
      name: "string",
      slug: "slug",
    },
  },
];

let entries = {};
let images = [];

const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const pushImageFromURL = async (url, api, entityID, field) => {
  const someImage = await fetch(url);

  const actualURL = someImage.url;

  const formData = new FormData();
  formData.append(
    "files",
    await someImage.blob(),
    actualURL.substring(actualURL.lastIndexOf("/") + 1)
  );
  formData.append("ref", api);
  formData.append("refId", entityID);
  formData.append("field", field);

  const response = await instance.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  delay(timeout);
  console.log(
    `Pushed image for ${api} with ID: ${entityID} and field: ${field}`
  );
};

const pushMultipleImages = async (api, entityID, field) => {
  for (let i = 0; i < imageRelationsCount; i++) {
    pushImageFromURL(faker.image.urlLoremFlickr(), api, entityID, field);
  }
};

const pushEntries = async (contentType) => {
  for (let i = 0; i < entriesCount; i++) {
    const entry = {};
    for (const [key, value] of Object.entries(contentType.structure)) {
      switch (value) {
        case "title":
          entry[key] = faker.lorem.words(10);
          break;
        case "slug":
          entry[key] = faker.lorem.slug(3);
          break;
        case "body":
          entry[key] = faker.lorem.paragraphs(10);
          break;
        case "string":
          entry[key] = faker.lorem.words(3);
          break;
        default:
          entry[key] = undefined;
      }
    }

    if (!entries[contentType.name]) {
      entries[contentType.name] = [];
    }
    entries[contentType.name].push(entry);
  }

  for (let d = 0; d < entries[contentType.name].length; d++) {
    const entry = entries[contentType.name][d];
    const response = await instance.post(`/${contentType.name}`, {
      data: entry,
    });
    entries[contentType.name][d] = response.data.data;
    delay(timeout);
    console.log(
      `Pushed ${d + 1} of ${entriesCount} entries with ID: ${
        response.data.data.id
      }`
    );
  }
};

const pushImages = async (destination) => {
  for (let i = 0; i < entries[destination.name].length; i++) {
    const entry = entries[destination.name][i];
    for (const [key, value] of Object.entries(destination.structure)) {
      switch (value) {
        case "image":
          await pushImageFromURL(
            faker.image.urlLoremFlickr(),
            destination.api,
            entry.id,
            key
          );
          break;
        case "images":
          await pushMultipleImages(destination.api, entry.id, key);
          break;
      }
    }
  }
};

const pushRelations = async (source, destination) => {
  for (let i = 0; i < entries[destination.name].length; i++) {
    const entry = entries[destination.name][i];
    const relations = [];
    for (let j = 0; j < relationsCount; j++) {
      const randomIndex = Math.floor(
        Math.random() * entries[source.name].length
      );
      const randomEntry = entries[source.name][randomIndex];
      relations.push(randomEntry.id);
    }
    const response = await instance.put(`/${destination.name}/${entry.id}`, {
      data: {
        [source.name]: relations,
      },
    });
    delay(timeout);
    console.log(
      `Pushed ${i + 1} of ${entries[destination.name].length} relations for ${
        destination.name
      } with ID: ${entry.id}`
    );
  }
};

const run = async () => {
  for (let i = 0; i < contentTypes.length; i++) {
    await pushEntries(contentTypes[i]);
  }

  await pushRelations(contentTypes[1], contentTypes[0]);
  await pushImages(contentTypes[0]);
};

run();
