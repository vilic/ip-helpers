/*
    IP Helpers
    https://github.com/vilic/ip-helpers

    MIT License
*/

import { networkInterfaces } from 'os';

export interface QueryResult {
    lanAddresses: string[];
    wanAddresses: string[];
}

class Helpers {
    static get lanAddresses(): string[] {
        return queryAddresses().lanAddresses;
    }
    
    static get lanAddress(): string {
        return queryAddresses().lanAddresses[0];
    }
    
    static get wanAddresses(): string[] {
        return queryAddresses().wanAddresses;
    }
    
    static get wanAddress(): string {
        return queryAddresses().wanAddresses[0];
    }
}

let apipaRegex = /^169\.254\./;

let lastQueryResult: QueryResult;

module.exports = exports = Helpers;

export function queryAddresses(): QueryResult {
    let interfaceGroups = networkInterfaces();
    
    if (!lastQueryResult) {
        let lanAddresses: string[] = [];
        let wanAddresses: string[] = [];
        
        for (let name of Object.keys(interfaceGroups)) {
            let interfaces = interfaceGroups[name];
            
            for (let ni of interfaces) {
                if (
                    ni.internal ||
                    ni.family !== 'IPv4' ||
                    ni.mac == '00:00:00:00:00:00' ||
                    apipaRegex.test(ni.address)
                ) {
                    continue;
                }
                
                let address = ni.address;
                
                if (internalIsLANAddress(address)) {
                    lanAddresses.push(address);
                } else {
                    wanAddresses.push(address);
                }
            }
        }
        
        lastQueryResult = {
            lanAddresses,
            wanAddresses
        };
    }
    
    setImmediate(() => {
        lastQueryResult = undefined;
    });
    
    return lastQueryResult;
}

function internalIsLANAddress(address: string): boolean {
    let bytes = address.split('.').map(byte => Number(byte));
    
    return bytes[0] === 10 ||
        (bytes[0] === 172 && (bytes[1] >> 4) === 1) ||
        (bytes[0] === 192 && bytes[1] === 168);
}

export function isLANAddress(address: string): boolean {
    return internalIsLANAddress(address) && !apipaRegex.test(address);
}

export function isWANAddress(address: string): boolean {
    return !internalIsLANAddress(address) && !apipaRegex.test(address);
}

export declare let lanAddress: string;
export declare let lanAddresses: string[];
export declare let wanAddress: string;
export declare let wanAddresses: string[];
