import fetch from 'node-fetch';
import {csvFormat} from 'd3-dsv';
import { writeFile } from 'fs/promises';
const maxPages = 500

class Asset{
  // constructor(name, id, price, hash, rarityScore, rarityRank){
  constructor(cnftToolsItem){
    this.name = cnftToolsItem.name
    this.id = cnftToolsItem.assetID
    this.price = 'not listed'
      // to add price from tools io - isNaN(cnftToolsItem.price)?cnftToolsItem.price:cnftToolsItem.price/1000000
    this.hash = cnftToolsItem.url
    this.rarityScore = cnftToolsItem.rarityScore
    this.rarityRank = cnftToolsItem.rarityRank
  }
}

async function main(){
  const toolsProjectName = 'yummiuniverse'
  const ioProjectName = 'Yummi Universe - Naru'

  // const toolsProjectName = 'claynation'
  // const ioProjectName = 'Clay Nation by Clay Mates'
  //
  // const ioProjectName = 'Cardoggos'

  const toolsData = await getCnftToolsData(toolsProjectName)
  // console.log('toolsData',toolsData[30])

  const collection = toolsData.map(item => new Asset(item))

  const ioData = await getCnftIoData(ioProjectName)
  const hashsAndAditionnalDataMap = getTargetData(ioData)

  collection.forEach(asset => injectAditionalData(asset, hashsAndAditionnalDataMap))
  console.log('collection',collection)

  const rankSheetData = collection.map(({name,price}) => {return {name,price}})
  console.log('rankSheetData',rankSheetData)
  const priceSheetData = collection.map(({name,rarityRank,id})=>{return{name,rarityRank,id}})

  const rankSheet = csvFormat(rankSheetData)
  const priceSheet = csvFormat(priceSheetData)
  // const results = csvFormat(collection)

  // const path = './results/'+ioProjectName+'.csv'
  //
  const pathRank = './results/'+ioProjectName+'-rank.csv'
  const pathPrice = './results/'+ioProjectName+'-price.csv'
  try {
    // await writeFile(path,results);
    await writeFile(pathRank,rankSheet);
    await writeFile(pathRank,rankSheet);
    await writeFile('../CSV-example/'+ioProjectName+'-rank.csv',priceSheet);
    await writeFile('../CSV-example/'+ioProjectName+'-price.csv',rankSheet);
    await writeFile(pathPrice,priceSheet);
    console.log('successfully saved rarity sheet'+pathRank);
    console.log('successfully saved price sheet'+pathPrice);
  } catch (error) {
    console.error('there was an error:', error.message);
  }
  }
main()
  

  function injectAditionalData(asset,map){
    const match = map.find(x=>{
      return x.hash === asset.hash 
    })
    if(match){
      
      console.log(`${asset.name} price found: ${match.price}`)
      asset.price = match.price / 1000000
      // const attributes = Object.keys(match.attributes)
      // attributes.forEach(name => {asset[name]=match.attributes[name]})
    }else{
      // asset.price = 'not found'
    }
    return asset
  }

  function getTargetData(ioData){
    return ioData.map(x=>{
      const hash = x.metadata.thumbnail.slice(-46) 
      const price = x.price
      //
      // attributes:
      // TODO: handle o objeto tag recursivamente
      //
      //let attributes = {}
      //if (x?.metadata?.tags[1]?.attributes != null){
      //  attributes = x.metadata.tags[1].attributes
      //}
      return { hash, price }
      

      })
  }

  async function getCnftToolsData(project){
    const data = []
    let i = 1 
    let numberOfAssets = 1

    while (numberOfAssets !=0 && i < maxPages){
      const page = await getCnftToolsPage(project, i)
      numberOfAssets = page.length
      console.log('cnftTools page '+ i ,numberOfAssets)
      data.push(...page)
      i++
    }
    console.log(`cnftools ${i} pages: ${data.length} items`)
    return data
  }

async function getCnftIoData(project){
    const data = []
    let i = 1 
    let numberOfAssets = 1

    while (numberOfAssets !=0 && i < maxPages){
      const page = await getCnftIoPage(project, i)
      numberOfAssets = page.length
      console.log('cnftIo page '+ i ,numberOfAssets)
      data.push(...page)
      i++
    }
    console.log(`cnftIo ${i} pages: ${data.length} items`)
    return data
}

  async function getCnftToolsPage(project, page){
    const uri = `https://cnft.tools/api/${project}?background=x&body=x&face=x&headwear=x&sort=ASC&method=rarity&page=${page}&`
    const response = await fetch(uri);
    const responseData = await response.json();
    return responseData.stats
  }

  async function getCnftIoPage(project, page){

    const form = {
      search: "",
      sort: "date",
      order: "desc",
      page,
      verified: true,
      project,
    };

    const params = new URLSearchParams(form);
    

    const response = await fetch('https://api.cnft.io/market/listings', {method: 'POST', body: params});
    const responseData = await response.json()
    return responseData.assets
  }

// project list endpoint
// https://api.cnft.io/market/projects 
//
//
// pool.io 
// https://api.cnft.io/market/listings
//
// error handle nos fetch
// otmimizar a comparacao dos 2 dicionarios
//
// ver o "available" e colocar nos dados
// handle error nos atributos
// now it if it doesent find a io price, it keeps the tool price
// arrumar o attributos q n aparece em todos os projetos no mesmo formato e quebra o programa
// deixar mais resistente ao erro e talvez pegar uma laternativa recursiva pra mapear todos os valores do tags
// pegar dados dos cardoggos pro mano
