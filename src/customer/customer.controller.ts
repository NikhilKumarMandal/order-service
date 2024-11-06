import { Response } from "express"
import { Request } from "express-jwt"
import customerModel from "./customer.model"


export class CustomerController{

    getCustomer = async (req:Request,res:Response) => {
        const { sub: userId, firstName, lastName, email } = req.auth

        const customer = await customerModel.findOne({ userId });

        if (!customer) {
            const newCustomer = await customerModel.create({
                userId,
                firstName,
                lastName,
                email,
                addresses: []
            })

            res.json(newCustomer)
        }
        
        res.json(customer)
    }

addAdress = async (req: Request, res: Response) => {
    try {
        const { sub: userId } = req.auth; 

        if (!req.body.address || typeof req.body.address !== 'string' || req.body.address.trim() === '') {
            return res.status(400).json({ message: 'Address is required and must be a non-empty string.' });
        }

        const customer = await customerModel.findOneAndUpdate(
            {
                _id: req.params.id, 
                userId 
            },
            {
                $push: {
                    addresses: {
                        text: req.body.address, 
                        isDefault: false 
                    }
                }
            },
            {
                new: true 
            }
        );
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        return res.json({ message: 'Address added successfully', customer });
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

}