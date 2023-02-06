const http = require("http");
const db = require('./db')
const { getReqData } = require("./utility");
require('dotenv').config();
const auth = require('./auth');

const PORT = process.env.DB_PORT || 8080;
const HOST = process.env.DB_HOST

async function restart() {
  let client = await db.init()
  while (!client) {
    try {
      client = await init();
      break;
    } catch (error) {
      console.error(error);
    }
    console.log("Attempting to reconnect in 5 seconds...");
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  } 

    //sign in
    if (req.url === "/signin" && req.method === "POST") {
      [id,password] = auth.auth(req,res)

      let sellers = await db.getSellers();
      let user = await sellers.find({ seller_id: id }).toArray((err, user) => {
        if (err) throw err;
      });
    
      if (user.length === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "User not found" }));
        return;
      }
    
      if ((user[0].seller_zip_code_prefix).toString() !== password) {
        res.writeHead(401, { "WWW-Authenticate": "Basic" });
        res.end();
        return;
      }
    
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(user));
    }
    
    
    // /order_items
    else if (req.url.match(/^\/order_item\/([a-zA-Z0-9]+)\?limit=(\d+)&offset=(\d+)&sort=(price|shipping_limit_date)$/) && req.method === "GET") {
      [id,password] = auth.auth(req,res);
      let status = auth.checkUser(id,password,res);
      if (status === false) { 
        res.writeHead(401, { "WWW-Authenticate": "Basic" });
        res.end();
        return
      }
      try {
        const pattern = /^\/order_item\/([a-zA-Z0-9]+)\?limit=(\d+)&offset=(\d+)&sort=(price|shipping_limit_date)$/;
        const match = req.url.match(pattern);
        const sellerId = match[1];
    
        const url = new URL(req.url, `http://${req.headers.host}`);
        const limit = Number(url.searchParams.get("limit")) || 20;
        const offset = Number(url.searchParams.get("offset")) || 0;
        const sortBy = url.searchParams.get("sort") || "shipping_limit_date";
    
        let orderitems = await db.getOrderList();
        let order_list = await orderitems
          .find({seller_id:sellerId})
          .sort({ [sortBy]: 1 })
          .skip(offset)
          .limit(limit)
          .toArray((err, user) => {
            if (err) throw err;
          });
    
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(order_list));
      } catch (error) {
        console.log(error);
        res.writeHead(404, { "Content-Type": "text" });
        res.end(JSON.stringify({ message: error }));
      }
    }

      // PRODUCT GET
    else if (req.url.match(/^\/product\/([a-zA-Z0-9]+)/) && req.method === "GET") {
      [id,password] = auth.auth(req,res);
      let status = auth.checkUser(id,password,res);
      if (status === false) { 
        res.writeHead(401, { "WWW-Authenticate": "Basic" });
        res.end();
        return
      }
      try {
        const pattern = /^\/product\/([a-zA-Z0-9]+)/;
        const match = req.url.match(pattern);
        const productId = match[1];
    
        let products = await db.getProducts();
        let product = await products
          .findOne({product_id: productId});
    
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(product));
      } catch (error) {
        console.log(error);
        res.writeHead(404, { "Content-Type": "text" });
        res.end(JSON.stringify({ message: error }));
      }
    }
    
    //ORDER ITEM GET
    else if (req.url.match(/^\/order_item\/([a-zA-Z0-9]+)/) && req.method === "GET") {
      [id,password] = auth.auth(req,res);
      let status = auth.checkUser(id,password,res);
      if (status === false) { 
        res.writeHead(401, { "WWW-Authenticate": "Basic" });
        res.end();
        return
      }
      try {
        const pattern = /^\/order_item\/([a-zA-Z0-9]+)/;
        const match = req.url.match(pattern);
        const order_id = match[1];
    
        let products = await db.getOrderList();
        let product = await products
          .findOne({order_id: order_id});
    
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(product));
      } catch (error) {
        console.log(error);
        res.writeHead(404, { "Content-Type": "text" });
        res.end(JSON.stringify({ message: error }));
      }
    }
    
    
    //DELETE order item
    else if (req.url.match(/^\/order_item\/([a-zA-Z0-9]+)$/) && req.method === "DELETE") {
      console.log('start delete')
      try {
          const pattern = /^\/order_item\/([a-zA-Z0-9]+)$/;
          const match = req.url.match(pattern);
          const id = match[1];
    
          let orderitems = await db.getOrderList();
          console.log('found')
          let result = await orderitems.deleteOne({order_id : id});
          console.log(result)
          if (result.deletedCount === 0) {
            throw new Error(`Order item with id ${id} not found`);
          }
          res.writeHead(204, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
      } catch (error) {
          console.error(error);
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: error.message }));
      }
    }
    
    

    // /account : UPDATE USER
    else if (req.url.match("/account") && req.method === "PUT") {
      try {
        const data = await getReqData(req);
        const buffer = Buffer.from(data);
        const string = buffer.toString();
        const body = JSON.parse(string);
        console.log(body)
        let sellers = await db.getSellers();
        let user = await sellers.findOne({seller_id : body.seller_id});
        if (!user) {
          throw new Error("Account not found");
        }
        let update = {};
        if (body.seller_city) {
          update.seller_city = body.seller_city;
        }
        if (body.seller_state) {
          update.seller_state= body.seller_state;
        }
        let result = await sellers.updateOne({seller_id: body.seller_id}, { $set: update });
        console.log(result)
        if (result.acknowledged !== true) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end('could not update');
        }
        res.writeHead(204, { "Content-Type": "application/json" });
        res.end(JSON.stringify(body));
      } catch (error) {
        console.log(error);
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end("Error updating account");
      }
    }
    
    // /account : UPDATE ITEM
    // else if (req.url.match(/^\/edit\/([a-zA-Z0-9]+)$/) && req.method === "PUT") {
    //   try {
    //     const data = await getReqData(req);
    //     const buffer = Buffer.from(data);
    //     const string = buffer.toString();
    //     const body = JSON.parse(string);
    //     let order_items = await db.getOrderList();
    //     let item = await order_items.findOne({order_id : body.order_id});
    //     if (!item) {
    //       throw new Error("item not found");
    //     }
    //     let update = {};
    //     if (body.price) {
    //       update.seller_city = body.seller_city;
    //     }
    //     if (body.seller_state) {
    //       update.seller_state= body.seller_state;
    //     }
    //     let result = await sellers.updateOne({seller_id: body.seller_id}, { $set: update });
    //     console.log(result)
    //     if (result.acknowledged !== true) {
    //       res.writeHead(404, { "Content-Type": "application/json" });
    //       res.end('could not update');
    //     }
    //     res.writeHead(204, { "Content-Type": "application/json" });
    //     res.end(JSON.stringify(body));
    //   } catch (error) {
    //     console.log(error);
    //     res.writeHead(404, { "Content-Type": "application/json" });
    //     res.end("Error updating account");
    //   }
    // }
    


    // No route present
    else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Route not found" }));
    }
});

server.listen(PORT,HOST, () => {
    console.log(`server started on port: ${PORT}`);
});