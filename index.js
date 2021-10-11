import fetch from 'node-fetch';
import {csvFormat} from 'd3-dsv';
import { writeFile } from 'fs/promises';
import chalk from 'chalk'
import { projectNames} from './project-names.js'
const maxPages = 500

let [node, path, resultsPath='./results/'] = process.argv
if(resultsPath[resultsPath.length-1] != '/'){
  resultsPath += '/'
}

  class Asset{
  // constructor(name, id, price, hash, rarityScore, rarityRank){
  constructor(cnftToolsItem){
    this.name = cnftToolsItem.name.replace(/[^\w\s]/g,'')
    this.id = cnftToolsItem.assetID
    this.price = 'x'
      // to add price from tools io - isNaN(cnftToolsItem.price)?cnftToolsItem.price:cnftToolsItem.price/1000000
    this.hash = cnftToolsItem.url
    this.rarityScore = cnftToolsItem.rarityScore
    this.rarityRank = cnftToolsItem.rarityRank
  }
}

async function getProjectData(name){
  const toolsProjectName = name[1]
  const ioProjectName = name[2]


  const toolsData = await getCnftToolsData(toolsProjectName)
  if (toolsData == null){
    console.log('error in '+ chalk.yellowBright('tools')+' project name:',chalk.red(toolsProjectName))
    return null
  }

  const collection = toolsData.map(item => new Asset(item))

  const ioData = await getCnftIoData(ioProjectName)
  if(ioData == null){
    console.log('error in '+ chalk.yellowBright('io')+' project name:', chalk.red(ioProjectName))
    return null
  }
  const hashsAndAditionnalDataMap = getTargetData(ioData)

  const counter = {found:0,notFound:0}
  collection.forEach(asset => injectAditionalData(asset, hashsAndAditionnalDataMap,counter))
  console.log('counter',counter)
  if (counter.found == 0){
    console.log(chalk.red('error crosrefferencing assets'))
    console.log('toolsData',toolsData[30])
    console.log('ioData',JSON.stringify(ioData[30],null,4))
    return
  }

  const rankSheetData = collection.map(({name,price}) => {return {name,price}})
  const priceSheetData = collection.map(({name,rarityRank,id})=>{return{name,rarityRank,id}})

  const rankSheet = csvFormat(rankSheetData)
  const priceSheet = csvFormat(priceSheetData)
  // const results = csvFormat(collection)

  // const path = './results/'+ioProjectName+'.csv'
  //
  const pathRank = resultsPath+ioProjectName+'-rank.csv'
  const pathPrice = resultsPath+ioProjectName+'-price.csv'
  try {
    // await writeFile(path,results);
    await writeFile(pathRank,rankSheet);
    await writeFile(pathRank,rankSheet);
    // await writeFile('../CSV-example/'+ioProjectName+'-rank.csv',priceSheet);
    // await writeFile('../CSV-example/'+ioProjectName+'-price.csv',rankSheet);
    await writeFile(pathPrice,priceSheet);
    console.log('successfully saved rarity sheet'+pathRank);
    console.log('successfully saved price sheet'+pathPrice);
  } catch (error) {
    console.error('there was an error:', error.message);
  }
  }
async function main(){
  // const results = await testNames(projects)

  for(let i = 0;i<projectNames.length;i++){

    await getProjectData(projectNames[i])

  }

  await writeFile(resultsPath + 'last-update',new Date().toUTCString());
    // await getData(projects[nProjects].toLowerCase().split(' ').join(''),projects[nProjects])

// getData('yummiuniverse','Yummi Universe - Narul')
}

main()
// testNames(projects)

  

  function injectAditionalData(asset,map, counter){
    const match = map.find(x=>{
      return x.hash === asset.hash || x.id === asset.id
    })
    if(match){
      
      console.log(`${asset.name} price found: ${match.price / 1000000}`)
      asset.price = match.price / 1000000
      // const attributes = Object.keys(match.attributes)
      // attributes.forEach(name => {asset[name]=match.attributes[name]})
      counter.found ++
    }else{
      // asset.price = 'not found'
      counter.notFound ++
    }
    return asset
  }

  function getTargetData(ioData){
    return ioData.map(x=>{
      const hash = x.metadata.thumbnail.slice(-46) 
      const price = x.price
      const regexDigits = x.metadata.name.match(/\d+/g)
      let id = 0
      if (regexDigits != null){
        id = regexDigits[0]
      }
      //
      // attributes:
      // TODO: handle o objeto tag recursivamente
      //
      //let attributes = {}
      //if (x?.metadata?.tags[1]?.attributes != null){
      //  attributes = x.metadata.tags[1].attributes
      //}
      return { hash, price ,id}
      

      })
  }

  async function getCnftToolsData(project){
    const data = []
    let i = 1 
    let numberOfAssets = Infinity

    while (numberOfAssets !=0 && i <= maxPages){
      const page = await getCnftToolsPage(project, i)
      if (page == null){
        return null
      }
      numberOfAssets = page.length
      console.log(project,'in cnftTools page '+ i ,numberOfAssets)
      data.push(...page)
      i++
    }
    console.log(`${project} in cnftools and ${i} pages: ${data.length} items scraped`)
    return data
  }

async function getCnftIoData(project){
    const data = []
    let i = 1 
    let numberOfAssets = Infinity

    while (numberOfAssets !=0 && i < maxPages){
      const page = await getCnftIoPage(project, i)
      if (page == null){
        return null
      }
      numberOfAssets = page.length
      console.log(project + ' in cnftIo, page '+ i ,numberOfAssets)
      data.push(...page)
      i++
    }
  console.log(`${project} in cnftIo: ${i} pages and ${data.length} items scraped`)
    return data
}

  async function getCnftToolsPage(project, page){
    const uri = `https://cnft.tools/api/${project}?background=x&body=x&face=x&headwear=x&sort=ASC&method=rarity&page=${page}&`
    const response = await fetch(uri);

    if (response.status != 200){
      console.log('status',response.status)
      return null 
    }
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

    if (response.status != 200){
      console.log('status',response.status)
      return null 
    }

    const responseData = await response.json()
    return responseData.assets
  }

export {
 getCnftIoPage,
 getCnftToolsPage
}





// project list endpoint
// https://api.cnft.io/market/projects 
//
//
// pool.io 
// https://api.cnft.io/market/listings
//
// error handle nos fetch
//
// handle error nos atributos
// arrumar o attributos q n aparece em todos os projetos no mesmo formato e quebra o programa
// deixar mais resistente ao erro e talvez pegar uma laternativa recursiva pra mapear todos os valores do tags
// nao rodar o tools se o nome io ta quebrado
// checkar pq ta dano erro no primeiro nome
