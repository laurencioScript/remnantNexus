const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const itemCategories = [
  // ["rings", "Rings"],
  // ["meleeWeapon", "Melee+Weapons"],
  // ["longGun", "Long+Guns"],
  // ["handGun", "Hand+Guns"],
  // ["amulet", "Amulets"],
  // ["relic", "Relics"],
  // ["headArmor", "Head+Armor"],
  // ["glove", "Gloves"],
  // ["bodyArmor", "Body+Armor"],
  // ["legArmor", "Leg+Armor"],
  // ["traits", "Traits"],
  // ["relicFragments", "Relic+Fragments"],
  // ["skills", "Skills"],
  // ["mutators", "Mutators"],
  // ["weaponMods", "Weapon+Mods"],
  ["classes", "Classes"],
];

async function loadItemCategory() {
  let items = [];

  for (const itemCategory of itemCategories) {
    const [typeItem, urlItemCategory] = itemCategory;
    const link = `https://remnant2.wiki.fextralife.com/${urlItemCategory}`;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {

      await page.goto(link, { timeout: 90000 });

      if (typeItem !== "classes") {
        await waitForAnySelector(page, [".table-tab", ".Table-tab"], 5000);
      }

      await page.waitForSelector("table");

      items = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll("tbody tr"));

        return rows.map((row) => {
          const linkItem = row.querySelector("td:nth-child(1) a");
          const type = row.querySelector("td:nth-child(4)").textContent;

          return {
            url: linkItem ? linkItem.href : "",
            type: type,
            exclusive: type.includes("cannot be crafted"),
          };
        });
      });
      items = items.filter(i => i.url)

      items = items.map(i => {
        i.path = typeItem;
        return i;
      })

    } catch (err) {
      console.error("GLOBAL", err);
    } finally {
      await browser.close();
    }

    await saveItemInJSON(items, typeItem);
  }
}

// loadItemCategory()
loadIError()
// loadByURLS()

async function loadIError() {
  const errors = await readJSONFromFile("error.json");
  // await writeJSONToFile('error.json', { items: [] });
  await saveItemInJSON(errors.items);
}

async function loadByURLS() {
  const urls = [
    {
      url: `https://remnant2.wiki.fextralife.com/Smolder`,
      path: "meleeWeapon",
    },
    {
      url: `https://remnant2.wiki.fextralife.com/World's+Edge`,
      path: "meleeWeapon",
    },
  ];

  await saveItemInJSON(urls);
}



async function saveItemInJSON(items, typeItem = null) {
  const db = await readJSONFromFile("db.json");
  const errors = await readJSONFromFile("error.json");
  for (let [index, item] of items.entries()) {
    try {
      const key = item.path || typeItem;
      const url = item.url;
      const imgName = `${new Date().getTime()}`;

      const element = {
        url,
        elementId: "infobox",
        outputPath: `imgs\\${imgName}.png`,
        name: imgName,
        path: key,
      };

      const result = await takeScreenshotOfElementById(element);

      printProgressBar(key, index + 1, items.length, 50, false);

      

      if (!result) {
        errors.items.push(element);
        writeJSONToFile("error.json", errors);
      } else {
        if (["skills", "mutators", "weaponMods"].includes(key)) {
          result.type = item.type;
        }

        if (["skills", "mutators", "weaponMods"].includes(key)) {
          result.exclusive = item.exclusive;
        }
        
        db[result.path].push(result);
        writeJSONToFile("db.json", db);
      }
    } catch (error) {
      console.log(">>> saveItemInJSON error", error);
    }
  }
}

function writeJSONToFile(fileName, data) {
  const jsonContent = JSON.stringify(data, null, 2);
  fs.writeFileSync(fileName, jsonContent);
}

function readJSONFromFile(fileName) {
  const jsonContent = fs.readFileSync(fileName, "utf8");
  const data = JSON.parse(jsonContent);
  return data;
}

async function waitForAnySelector(page, selectors, timeout) {
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout });
      return selector;
    } catch (error) {}
  }
  throw new Error("Nenhum seletor funcionou dentro do tempo limite");
}

function printProgressBar(
  name,
  currentValue,
  maxValue,
  barLength = 50,
  clearOn = false
) {
  const progress = currentValue / maxValue;
  const progressChars = Math.floor(barLength * progress);
  const progressBar = `[${"=".repeat(progressChars)}${" ".repeat(
    barLength - progressChars
  )}]`;
  if (clearOn) {
    console.clear();
  }
  const percentage = Math.round(progress * 100);
  console.log(`${name}\n${progressBar} ${percentage}%`);
}

async function screenPhotobyLink({ imageUrl, outputPath }) {
  const response = await axios.get(imageUrl, {
    responseType: "arraybuffer",
  });

  fs.writeFileSync(outputPath, response.data);
}

async function takeScreenshotOfElementById({
  url,
  elementId,
  outputPath,
  name,
  path,
}) {
  const browser = await puppeteer.launch({
    defaultViewport: { width: 1920, height: 1080 },
    headless: "new",
  });
  const page = await browser.newPage();

  try {
    await page.goto(url, { timeout: 90000 });
    await page.waitForSelector(`#${elementId}`);

    let titleElement = await page.$(".infobox_a_title h2 span");
    if (!titleElement) {
      titleElement = await page.$(".infobox_a_title h2");
    }
    if (!titleElement) {
      titleElement = await page.$("th h2");
    }


    let spanProperty = await titleElement.getProperty("textContent");
    const title = await spanProperty.jsonValue();

    titleElement = await page.$(".infobox_a_description td");
    // if (!titleElement) {
    //   titleElement = await page.$(".infobox_a_description td");
    // }
    let description = null
    if(titleElement){
      spanProperty = await titleElement.getProperty("textContent");
      description = await spanProperty.jsonValue();
    }

    
    let modExclusive = null;
    let modElement = await page.$(".infobox_a_mod_mutator");
    
    if (modElement) {
      modElement = await page.$(".infobox_a_mod_mutator h4 a");
      const modTextContent = await page.evaluate(el => el.textContent, modElement);
      modExclusive = modTextContent;
    }

    await page.evaluate(() => {
      const footerElement = document.querySelector(".infobox_a_mod_mutator");
      if (footerElement) {
        footerElement.style.display = "none";
      }
    });
    
    

    let element = await page.$(".infobox_a_image_background img");
    if(!element){
      element = await page.$("tr td img");
    }
    let href = await element.getProperty("src");
    const imgPng = await href.jsonValue();
    await screenPhotobyLink({
      imageUrl: imgPng,
      outputPath: outputPath.replace(".png", "_short.png"),
    });
    const elementHandle = await page.$(`#${elementId} .wiki_table tbody`);
    const boundingBox = await elementHandle.boundingBox();

    await page.evaluate(() => {
      const footerElement = document.querySelector(".footer-sticky");
      if (footerElement) {
        footerElement.style.display = "none";
      }
    });

    await new Promise((r) => setTimeout(r, 1000));

    if (!boundingBox) {
      throw new Error(
        `Element with ID "${elementId}" not found or not visible.`
      );
    }

    await page.screenshot({
      path: outputPath,
      clip: boundingBox,
    });

    return {
      name: title,
      img: name + ".png",
      img_short: name + "_short.png",
      description: description,
      source: url,
      path,
      modExclusive
    };
  } catch (err) {
    console.error("takeScreenshotOfElementById", err);
  } finally {
    await browser.close();
  }
}
