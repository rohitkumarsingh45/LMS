import mongoose from 'mongoose';

mongoose.set('strictQuery', false);

const connectionToDB = async () => {
    try {
        const { connection } = await mongoose.connect( // ✅ Fixed typo here
            process.env.MONGO_URI || `mongodb+srv://12345:12345@cluster0.atxjx.mongodb.net`
        );

        if (connection) {
            console.log(`Connected To MongoDB: ${connection.host}`);
        }

    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

export default connectionToDB;
 