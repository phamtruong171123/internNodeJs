const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');

// Đọc dữ liệu từ file input.txt
const data = JSON.parse(fs.readFileSync('F:/Intern NodeJS/internNodeJs/optimizing/src/MultiTable_Metadata/input.txt', 'utf8'));

// Chuyển đổi các _id có dạng {"$oid": "some_id"} thành ObjectId
data.forEach(item => {
  if (item._id && item._id.$oid) {
    item._id = new ObjectId(item._id.$oid);  // Sử dụng 'new' để tạo ObjectId MongoDB
  }
});

// Kết nối MongoDB và insert dữ liệu vào collection customer_data
MongoClient.connect('mongodb://localhost:27017')
  .then(client => {
    const db = client.db('mydb'); 
    const collection = db.collection('customer_data'); 
    collection.insertMany(data)
      .then(result => {
        console.log(`${result.insertedCount} documents were inserted`);
        client.close();
      })
      .catch(err => {
        console.error(err);
      });
  })
  .catch(err => {
    console.error(err);
  });
