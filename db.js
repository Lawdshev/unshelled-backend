require('dotenv').config();
const {MongoClient} = require('mongodb')
const userName = process.env.DB_USER;
const password = process.env.DB_PASSWORD;

async function init(){
    const uri = `mongodb+srv://${userName}:${password}@cluster0.rhppjn7.mongodb.net/?retryWrites=true&w=majority`;
    const client = new MongoClient(uri);
    try {
        await client.connect()
    } catch (error) {
        console.log(error)
    } finally{
       console.log('connected')
    }
    return client
}

async function getSellers() {
    let client = await init();
    let sellers = client.db('olist').collection('SELLERS')
    return sellers
}
async function getOrderList() {
    let client = await init();
    let orderlist = client.db('olist').collection('order_items')
    return orderlist
}
async function getProducts() {
    let client = await init();
    let products = client.db('olist').collection('Products')
    return products
}

module.exports.init = init;
module.exports.getOrderList = getOrderList;
module.exports.getProducts = getProducts;
module.exports.getSellers = getSellers;
