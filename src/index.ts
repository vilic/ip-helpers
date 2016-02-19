/*
    IP Helpers
    https://github.com/vilic/ip-helpers

    MIT License
*/

import { networkInterfaces, NetworkInterfaceInfo } from 'os';

export interface QueryResult {
    lanInterfaces: NetworkInterface[];
    wanInterfaces: NetworkInterface[];
}

export interface NetworkInterface extends NetworkInterfaceInfo {
    name: string;
}

class Helpers {
    static get lanInterfaces(): NetworkInterface[] {
        return queryInterfaces().lanInterfaces;
    }

    static get lanInterface(): NetworkInterface {
        let interfaces = Helpers.lanInterfaces;

        if (interfaces.length) {
            return interfaces[0];
        } else {
            return undefined;
        }
    }

    static get lanAddresses(): string[] {
        return Helpers.lanInterfaces.map(ni => ni.address);
    }

    static get lanAddress(): string {
        let ni = Helpers.lanInterface;
        return ni && ni.address;
    }

    static get wanInterfaces(): NetworkInterface[] {
        return queryInterfaces().wanInterfaces;
    }

    static get wanInterface(): NetworkInterface {
        let interfaces = Helpers.wanInterfaces;

        if (interfaces.length) {
            return interfaces[0];
        } else {
            return undefined;
        }
    }

    static get wanAddresses(): string[] {
        return Helpers.wanInterfaces.map(ni => ni.address);
    }

    static get wanAddress(): string {
        let ni = Helpers.wanInterface;
        return ni && ni.address;
    }
}

module.exports = exports = Helpers;

export declare const lanAddress: string;
export declare const lanAddresses: string[];
export declare const lanInterface: NetworkInterface;
export declare const lanInterfaces: NetworkInterface[];

export declare const wanAddress: string;
export declare const wanAddresses: string[];
export declare const wanInterface: NetworkInterface;
export declare const wanInterfaces: NetworkInterface[];

let apipaRegex = /^169\.254\./;

let lastQueryResult: QueryResult;

export function queryInterfaces(): QueryResult {
    let interfaceGroups = networkInterfaces();

    if (!lastQueryResult) {
        let lanInterfaces: NetworkInterface[] = [];
        let wanInterfaces: NetworkInterface[] = [];

        for (let name of Object.keys(interfaceGroups)) {
            let interfaces = interfaceGroups[name];

            for (let info of interfaces) {
                if (
                    info.internal ||
                    info.family !== 'IPv4' ||
                    info.mac == '00:00:00:00:00:00' ||
                    apipaRegex.test(info.address)
                ) {
                    continue;
                }

                let ni = info as NetworkInterface;
                ni.name = name;

                if (internalIsLANAddress(info.address)) {
                    lanInterfaces.push(ni);
                } else {
                    wanInterfaces.push(ni);
                }
            }
        }

        lastQueryResult = {
            lanInterfaces,
            wanInterfaces
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

export function calculateBroadcastAddress(address: string, netmask: string): string {
    let addressParts = address.split('.').map(partStr => Number(partStr));
    let netmaskParts = netmask.split('.').map(partStr => Number(partStr));

    return addressParts
        .map((addressPart, index) => {
            let netmaskPart = netmaskParts[index];
            return 255 - netmaskPart + (addressPart & netmaskPart);
        })
        .join('.');
}
