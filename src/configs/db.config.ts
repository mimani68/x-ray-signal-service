import { ConfigService } from "@nestjs/config";
import { MongooseModuleFactoryOptions } from "@nestjs/mongoose";

export async function mongodbConfig (configService: ConfigService) : Promise<MongooseModuleFactoryOptions> {
    return {
        uri: configService.get<string>('MONGODB_URI'),
    }
}