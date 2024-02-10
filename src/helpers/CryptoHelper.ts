import * as crypto from 'crypto';

class CryptoHelper {

    public static generateRandomString(length: number): String {
        const buffer = crypto.randomBytes(Math.ceil(length / 2));
        return buffer.toString('hex').slice(0, length);
    }
}

export default CryptoHelper;