import fetch from 'node-fetch';
import {csvFormat} from 'd3-dsv';
import { writeFile } from 'fs/promises';
const maxPages = 500

class Asset{
  // constructor(name, id, price, hash, rarityScore, rarityRank){
  constructor(cnftToolsItem){
    this.name = cnftToolsItem.name
    this.id = cnftToolsItem.assetID
    this.price = cnftToolsItem.price
    this.hash = cnftToolsItem.url
    this.rarityScore = cnftToolsItem.rarityScore
    this.rarityRank = cnftToolsItem.rarityRank
  }
}

async function main(){

  const toolsData = await getCnftToolsData('yummiuniverse')
  const collection = toolsData.map(item => new Asset(item))
  // console.log('collection',collection)

  const ioData = await getCnftIoData('Yummi Universe - Naru')
  const hashsAndPricesMap = getPrices(ioData)

  collection.forEach(asset => injectPrice(asset, hashsAndPricesMap))
  // console.log('ioData',collection)
  // const ioData = await getCnftIoData('Clay Nation by Clay Mates', 1)
  // console.log('ioData',ioData
  // console.log(JSON.stringify(ioData,null,4))
  //
  // const prices = getPrices(ioData)
  // const mergedData = cnftToolsData.map(injectPrice)
  const results = csvFormat(collection)

  try {
    await writeFile('data.csv',results);
    console.log('successfully saved data.csv');
  } catch (error) {
    console.error('there was an error:', error.message);
  }
  }
main()
  

  function injectPrice(asset,map){
    const match = map.find(x=>{
      return x.hash === asset.hash 
    })
    if(match){
      
      console.log(`${asset.name} price found: ${match.price}`)
      asset.price = match.price / 1000000
    }else{
      asset.price = 'not found'
    }
    return asset
  }

  function getPrices(ioData){
    return ioData.map(x=>{
        return { hash:x.metadata.thumbnail.slice(-46) , price:x.price }

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
    console.log('uri',uri)
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
    console.log('responseData',responseData.assets[0])
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
// ver o "available" e colocar nos dados
// colocar um limite de paginas pra ficar mais facil de testar
