const router=require('express').Router()
const User=require('../models/user.model')
const mongoose=require('mongoose')
router.get('/users',async(req,res,next)=>{
    try {
        const users =await User.find()
        // res.send(users) 
        res.render('manage-documents',{users})
    } catch (error) {
        next(error)
    }
})

router.get('/user/:id',async(req,res,next)=>{
    try {
        const {id}=req.params
        if(!mongoose.Types.ObjectId.isValid(id)){
            req.flash('error','Invalid Id')
            res.redirect('/admin/users')
            return
        }const person=await User.findById(id)
        res.render('profile',{person})
    } catch (error) {
        next(error)
    }
})

module.exports=router 