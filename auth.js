const db = require('./db')
function auth(req,res) {
    const auth = req.headers.authorization;
      if (!auth || !auth.startsWith("Basic ")) {
        res.writeHead(401, { "WWW-Authenticate": "Basic" });
        res.end();
        return;
      }
    
      const base64Credentials = auth.split(" ")[1];
      const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
      const [id, password] = credentials.split(":");
      return [id,password]
}

async function checkUser (id,password,res) {
    let sellers = await db.getSellers();
    let user = await sellers.find({ seller_id: id }).toArray((err, user) => {
      if (err) throw err;
    });
  
    if (user.length === 0) {
      return false;
    }
  
    if ((user[0].seller_zip_code_prefix).toString() !== password) {
      return false;
    }
    return true
}

module.exports.auth = auth
module.exports.checkUser = checkUser