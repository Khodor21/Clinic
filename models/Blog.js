const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  introduction: {
    type: String,
  },
  mainContentOne: {
    type: String,
  },
  mainContentTwo: {
    type: String,
  },
  mainContentThree: {
    type: String,
  },
  conclusion: {
    type: String,
  },
  name: {
    type: String,
  },
  datePublished: {
    type: Date,
  },
  filePath: {
    type: String,
  },
});

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
