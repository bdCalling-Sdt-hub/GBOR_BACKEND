const BannerModel=require("../model/bannerSchema");



exports.banner=async(req,res,next)=>{ 

   if(req.user.role=="admin"){
    try{
        if(req.files.bannerImage==undefined){
            return res.status(400).json({status:400,message:"Banner image is required"});
        }

        let bannerimage="";
       
        if (req.files.bannerImage[0]) {
            bannerimage = `${req.protocol}://${req.get('host')}/upload/image/${req.files.bannerImage[0].filename}`;
        }

        console.log(bannerimage)

        const response=new BannerModel({
            bannerImage:bannerimage
        });
        const bannerImages=await response.save();
        return res.status(200).json({status:200,message:"Banner images add successfully"});

    }catch(err){
       next(err.message);
    }
   }else{
    return res.status(401).json({status:401,message:"UnAuthorized user"});  
   }
   
    
}

exports.bannerDataGet=async(req,res,next)=>{
    if(req.user.role=="admin"){

       try{
            let AllBanners = await BannerModel.find();
            return res.status(200).json({status:200,message:"Data get successfully",data:{"Banners data":AllBanners}})
           

       }catch(err){
          next(err.message);
       } 
    }else{
        return res.status(401).json({status:401,message:"UnAuthorized user"});
    }
}


exports.bannerDelete=async(req,res,next)=>{
     if(req.user.role=="admin"){
         const banner=await BannerModel.findById(req.params.id);
         
         if(banner){
             const deleteBanner=await BannerModel.findByIdAndDelete(req.params.id);
             return res.status(200).json({status:200,message:"Banner delete successfully"});
 
         }else{
            return res.status(400).json({status:400,message:"Banner Not deleted"});

         }
     }else{
        return res.status(401).json({status:401,message:"UnAuthorized user"});  
     }
}