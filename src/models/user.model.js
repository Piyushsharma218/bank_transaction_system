const mongoose=require("mongoose")
const bcrypt=require("bcryptjs")

const userSchema=new mongoose.Schema({
    email:{
        type:String,
        unique:[true,"emial laready exists"],
        required:[true,"email is required"],
        trim:true,
        lowrecase:true,
        match:[/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    name:{
        type:STring,
        required:[true,"name is required for creating a account"]
    },
    password:{
        type:String,
        required:[true,"password is required of creating a account"],
        minlength:[6,"password should contain more than 6 characters"],
        select:false
    }
},{
    timestamps:true
})

userSchema.pre("save",async function(){
if(!this.isModified("password")){
    return next()
}

const hash=await bcrypt.hash(this.password,10)
this.password=hash

return  next()
})


userSchema.methods.comparePassword=async function(){
    return await bcrypt.compare(password,this.password)
}

const userModel=mongoose.model("user",userSchema)

module.exports=userModel