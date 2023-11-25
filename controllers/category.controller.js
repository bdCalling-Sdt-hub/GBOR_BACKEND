const CategoryModel = require("../model/categorySchema");

exports.category = async (req, res, next) => {

    if (req.user.role == "admin") {
        try {
            let categoryLowercase=req.body.categoryName.toLowerCase();
          
            let categoryExists=await CategoryModel.findOne({categoryName:categoryLowercase});
            if(categoryExists){
                return res.status(409).json({ status: 200, message: "Category already exists" });
            }else{
                const response = new CategoryModel({
                    categoryName: categoryLowercase
                });
                const category = await response.save();
                return res.status(200).json({ status: 200, message: "Category add successfully" });
            }
            
        } catch (err) {
            return res.status(409).json({ status: 200, message: "Failed! Try again" });
        }
    } else {
        return res.status(401).json({ status: 401, message: "UnAuthorized user" });
    }
    console.log(req.body.categoryName);

}

exports.categoryGet=async(req,res)=>{
    try{
        let AllCategories = await CategoryModel.find();
        return res.status(200).json({status:200,message:"Data get successfully",data:{"categories":AllCategories}})
       

    }catch(err){
      next(err.message);
    } 
}

exports.categoryDelete=async(req,res)=>{
    if(req.user.role=="admin"){
        const category=await CategoryModel.findById(req.params.id);
        
        if(category){
            const deleteCategory=await CategoryModel.findByIdAndDelete(req.params.id);
            return res.status(200).json({status:200,message:"Category delete successfully"});

        }else{
           return res.status(400).json({status:400,message:"Category Not found"});

        }
    }else{
       return res.status(401).json({status:401,message:"UnAuthorized user"});  
    }
}

exports.categoryUpdate=async(req,res)=>{
    console.log(req.body)
    if(req.user.role=="admin"){
        const category=await CategoryModel.findById(req.params.id);

        let categoryLowercase=(req.body.categoryName).toLowerCase();
          
        let categoryExists=await CategoryModel.findOne({categoryName:categoryLowercase});
        if(categoryExists && categoryExists._id!==req.params.id){
            return res.status(409).json({ status: 200, message: "Category already exists" });
        }else{
            let data = await CategoryModel.findByIdAndUpdate(req.params.id, {categoryName:categoryLowercase}, { new: true })

            return res.status(200).json({ status: 200, message: "Category updated successfully"});
        }
        
        
    }else{
       return res.status(401).json({status:401,message:"UnAuthorized user"});  
    }
}