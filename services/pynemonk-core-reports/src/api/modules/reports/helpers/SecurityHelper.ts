import { execFile } from "child_process";
import { injectable } from "tsyringe";
import * as fs from "fs";
import * as path from "path";

@injectable()
export default class SecurityHelper {
    /**
     * Compresses a raw file into a password-protected zip file using native OS 'zip' tool.
     * @param rawFilePath Absolute path to the unencrypted output file
     * @param zipFilePath Absolute path where the resulting .zip file should be saved
     * @param password Password for encryption
     */
    public encryptZip(rawFilePath: string, zipFilePath: string, password?: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(rawFilePath)) {
                return reject(new Error(`Source file does not exist: ${rawFilePath}`));
            }

            // Ensure destination directory exists
            const destDir = path.dirname(zipFilePath);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }

            // If no password is provided, perform a standard zip
            const args = ["-j"];
            if (password && password.trim().length > 0) {
                args.push("-P", password.trim());
            }
            args.push(zipFilePath, rawFilePath);

            console.log(`[SecurityHelper] Compressing: ${rawFilePath} → ${zipFilePath} (password protected: ${!!password})`);
            
            // Execute using execFile (which is safe against shell-injections as it bypasses the shell parser)
            execFile("zip", args, (err, stdout, stderr) => {
                if (err) {
                    console.error("[SecurityHelper] Zip process error:", err, stderr);
                    return reject(new Error(`Failed to compress report: ${err.message}`));
                }
                
                if (fs.existsSync(zipFilePath)) {
                    console.log(`[SecurityHelper] Compression successful. Output size: ${fs.statSync(zipFilePath).size} bytes`);
                    resolve();
                } else {
                    reject(new Error("Zip command completed but output file was not created."));
                }
            });
        });
    }
}
