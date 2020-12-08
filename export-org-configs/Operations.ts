import { Request, Response } from "express";
import exec from 'child_process';
import { request } from "request";
import fs from 'fs';

export class OperationsManager {

  /**
 * Sends the new organizations artifacts via HTTPS request 
 * (Peer json, Orderer json, Orderer server.crt TLS certificate)
 */
  public async sendOrgArtifacts() {
    const nameOrg = process.argv[2];
    const orderer = process.argv[3];
    const domain = process.argv[4];
    const orgIp = process.argv[5];
    const destIp = process.argv[6];
    const jwtToken = process.argv[7];

    var orgsJson = fs.readFileSync('onBoardFiles/' + nameOrg + '.json');
    var orgsJSON = JSON.parse(orgsJson);

    var jsonFile = fs.readFileSync('onBoardFiles/' + orderer + '.json');
    var ordererJSON = JSON.parse(jsonFile);

    var tlsCert = fs.readFileSync('onBoardFiles/server.crt').toString();

    var orgInfo = {
      nameOrg,
      orderer,
      orgsJSON,
      ordererJSON,
      orgIp,
      domain,
      orgDestinationIp: destIp,
      tls: tlsCert
    }

    request.post({
      headers: {
        'content-type': 'application/json',
        "Authorization": `Bearer ${jwtToken}`
      },
      url: 'http://' + destIp + ':8000/receive-organization-json',
      body: JSON.stringify(orgInfo)
    }, function (body: any) {
      console.log("Response ", body);
    });
  }

  /**
  * Makes a get request to retrieve the orderer genesis for the 
  * new orderer to join the network and raft consensus. Receives
  * a .block file and saves it to a location where the new orderer
  * can find it and start up
  */
  public async fetchOrdererGenesis(req: Request, res: Response) {
    const jwtToken = process.argv[2];
    const destIp = process.argv[3];

    request.post({
      headers: {
        'content-type': 'application/json',
        "Authorization": `Bearer ${jwtToken}`
      },
      url: 'http://' + destIp + ':8000/orderer-genesis',
    }, function (body: any) {
      console.log("Response ", body);
    });
  }

  /**
 * Creates a request to get a channel X configuration and saves 
 * it as a .block file to a location that is mapped out by the peer
 * in the docker-compose.yml
 */
  public async fetchChannelJoin(req: Request, res: Response) {
    const channelName = req.body.channelName;
    const orgDomain = req.body.orgDomain;

    exec(`docker exec -it cli peer channel fetch 0 -c ${channelName} --orderer orderer.${orgDomain}:7050 --tls --cafile /etc/hyperledger/crypto-config/ordererOrganizations/orderers/orderer.${orgDomain}/tls/ca.crt`, (error: { message: any; }, stdout: any, stderr: any) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });

    exec(`docker exec -it cli peer channel join -b ./${channelName}.block`, (error: { message: any; }, stdout: any, stderr: any) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });

  }

  /**
 * Starts the orderer after receiving the orderer genesis block
* @todo Script to start the orderer
 */
  public async startOrderer(req: Request, res: Response) {
    exec("docker-compose -f docker-compose.yml up -d orderer", (error: { message: any; }, stdout: any, stderr: any) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });
  }

  /**
* Makes an https request and retrieves a chaincode. Sends a chaincode
* name as a parameter so the endpoint can know which chaincode
* to send. Saves the chaincode as a .pak extension so it can be
* installed on the peer
* @param ChaincodeNome
*/
  public async fetchChaincode(req: Request, res: Response) {
    const jwtToken = process.argv[2];
    const destIp = process.argv[3];

    request.post({
      headers: {
        'content-type': 'application/json',
        "Authorization": `Bearer ${jwtToken}`
      },
      url: 'http://' + destIp + ':8000/get-chaincode',
    }, function (body: any) {
      console.log("Response ", body);
    });

  }

  /**
* Installs the chaincode received to a peer
* @param peerName
* @param chaincodeName
* @todo Script to install the chaincode to the peer
*/
  public async installChaincode(req: Request, res: Response) {
    exec("docker exec -it cli peer channel fetch ", (error: { message: any; }, stdout: any, stderr: any) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });

  }

  /**
   * Approves the chaincode for the organization
   * @param peerName
   * @param chaincodeName
   * @todo Script to approve for the chaincode
   */
  public async approveChaincodeForOrg(req: Request, res: Response) {

  }
}

export default OperationsManager;
