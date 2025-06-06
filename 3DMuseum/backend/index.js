
import express, { json, urlencoded } from 'express'
import 'dotenv/config';
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import multer, { memoryStorage } from 'multer'
import bodyParser from 'body-parser'

import { PinataSDK } from "pinata-web3"

import  isNumeric  from './utils.js'


const app = express()
const port = process.env.PORT || 3000

let corsOptions = {
	origin: ['http://localhost:5173', 
			 'https://virtual-art-museum.netlify.app'
			]
}

// Parse JSON requests
// app.use(express.json(), bodyParser.json(), express.urlencoded({ extended: true }), cors(corsOptions))

app.use(json()) // Parses incoming JSON requests
app.use(urlencoded({ extended: true })) // Parses URL-encoded data
app.use(cors(corsOptions)) // Applies CORS

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// const pinataApiKey = process.env.PINATA_API_KEY
// const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY

const pinataURL = process.env.PINATA_URL
const pinataJWT = process.env.PINATA_JWT


const pinata = new PinataSDK({
	pinataJwt: pinataJWT,
	pinataGateway: pinataURL
});

const Museum = {
	ART_GALLERY: 0,
	BRITISH_MUSEUM: 1,
	LOUVRE: 2
}

const storage = memoryStorage() // In-memory storage
const upload = multer({ storage })


const validateData = (data) => {
	const errors = []

	if (!data.title || data.title.length > 40) {
		errors.push('Title is required and must be at most 40 characters.')
	}
	if (!data.description || data.description.length > 200) {
		errors.push('Description is required and must be at most 200 characters.')
	}

	if (data.name.length < 3 || data.name.length > 30) {
		errors.push('Handle must be atleast 3 character and most 30 characters.')
	}

	if (data.price && isNumeric(data.price)) {
		errors.push('Price has to be a number')
	}

	if (parseFloat(data.price) > 2000.0) {
		errors.push('Please keep the price below 2000')
	}

	if (!Object.values(Museum).includes(parseInt(data.museum))) {
		errors.push('Museum must be 0, 1 or 2')

	}

	return errors
}

// Define a couple of endpoints
app.get('/list/:museum', async (req, res) => {

	const museum = req.params.museum

	try {

		const { data, error: checkError } = await supabase
			.from('museum')
			.select('id, created_at, img_id, img_cid, museum, title, description, price, name')
			.eq('museum', museum)
		// .single() // Get a single entry if it exists

		if (checkError) {
			throw checkError
		}

		// console.log("data: ", data)

		return res.status(200).json({ success: true, data, message: 'Items retrieved successfully' })


	} catch (error) {
		return res.status(500).json({ success: false, message: 'List error', error: error.message })
	}


})


const uploadToPinata = async (file) => {

	const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-'); // Format timestamp for filename
    const originalName = file.originalname; 

    const nameParts = originalName.split('.');
    const fileName = nameParts.slice(0, -1).join('.'); 
    const extension = nameParts.pop();

    const newFileName = `${fileName}_${timestamp}.${extension}`;

	// console.log("File name: ", newFileName)
	file = new File([file.buffer], newFileName, { type: file.mimetype })

	try {
		const upload = await pinata.upload.file(file);
		// console.log("Upload hash: ", upload)

		return upload.IpfsHash

	} catch (error) {
		console.log(error);
	}
}


app.post('/upload', upload.single('file'), async (req, res) => {
	const ipAddress = req.headers['x-forwarded-for'] || req.ip

	let { img_id, title, description, price, name, museum } = req.body

	museum = parseInt(museum)

	if (price) {
		price = parseFloat(price)
	}

	// Validate input data
	const errors = validateData(req.body)
	if (errors.length > 0) {
		return res.status(400).json({ success: false, errors })
	}

	let file_ipfs = null

	// Handle file upload to Pinata
	if (req.file) {
		try {
			file_ipfs = await uploadToPinata(req.file)
		} catch (err) {
			return res.status(500).json({ success: false, message: 'File upload failed', error: err.message })
		}
	}



	try {

		// check for existing entry, if it exist, updated it else insert it as a new row
		const { data: existingEntries, error: checkError } = await supabase
			.from('museum')
			.select('*')
			.eq('img_id', img_id)
			.limit(1) // Get a single entry if it exists

		// console.log("existing data: ", existingEntries)

		if (checkError && checkError.code !== 'PGRST100') { // Ignore not found error
			throw checkError
		}

		if (existingEntries.length > 0) {
			const { values, error: updateError } = await supabase
				.from('museum')
				.update({
					ip_address: ipAddress,
					img_id: img_id,
					title,
					description,
					price,
					name,
					img_cid: file_ipfs, //store ipfs hash
					museum: parseInt(museum)
				})
				.eq('img_id', img_id)

			if (updateError) {
				throw updateError
			}

			// console.log("values: ", values)

			return res.status(200).json({ success: true, data: values, message: 'Item updated successfully' })

		} else {

			// Insert the item into Supabase with file URL
			const { values, error } = await supabase
				.from('museum')
				.insert({
					ip_address: ipAddress, img_id: img_id, title, description,
					price, name, img_cid: file_ipfs, museum: parseInt(museum)
				})//store ipfs hash

			if (error) {
				throw error
			}

			return res.status(200).json({ success: true, data: values })
		}


	} catch (err) {
		// Handle database errors gracefully
		console.log('error: ', err)
		res.status(500).json({ success: false, message: 'An error occurred', error: err.message })
	}
})


app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`)
})
