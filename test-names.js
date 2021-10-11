import {getCnftToolsPage, getCnftIoPage} from './index.js'
const projects = [
  "Clay Mates", // not in tools
  "SpaceBudz", // ok
  "Deadpxlz", // not in tools
  "Yummi Universe", // ok
  "ADA Ninjaz", // ok
  "SweetFellas", //not in tools
  "ADAPunkz", // ok
  "Stone Age Hooligans", // not in tools
  "Baby Alien Club", // io BabyAlienClub
  "DeepVision by VisionAI", // not in tools
  "Lucky Lizard Club", // ok
  "CardanoApes", //2dcardanoapes in tools
  "Very Important Dummies", // VeryImportantDummies on io
  "Cardano Trees", // CardanoTrees on io
  "unsigned_algorithms", // not in tools
  "CryptoDino", // ok
  "Derp Birds", // ok
  "CardanoCity", // not in tools
  "Drunken Dragon", // not found
  "CardanoBits", // ok
];

async function testNames(names=projects) {



const results = [];

for (let i = 0; i < names.length; i++) {
  const result = [];
  result.push(names[i]);
  const nameTools = names[i].toLowerCase().split(" ").join("");
  console.log("testing ", nameTools, "on cnft.tools");
  if ((await getCnftToolsPage(nameTools, 1)) !== null) {
    result.push(nameTools);
  } else {
    result.push("--");
  }

  const nameIo = names[i];
  console.log("testing ", nameIo, "on io.tools");
  if ((await getCnftIoPage(nameIo, 1)) !== null) {
    result.push(nameIo);
  } else {
    result.push("--");
  }
  results.push(result);
}

console.table(results);
console.log(results);
const filtered = results.filter((r) => r[1] !== "--" && r[2] !== "--");
return results;
}

testNames()
