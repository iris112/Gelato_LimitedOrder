import React, { useState, useEffect, useCallback } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import Button from '@material-ui/core/Button';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import FormGroup from '@material-ui/core/FormGroup';
import axios, { AxiosResponse } from 'axios';
import { Contract } from '@ethersproject/contracts';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { hexlify, hexZeroPad } from '@ethersproject/bytes';
import { randomBytes } from '@ethersproject/random';
import { Wallet } from '@ethersproject/wallet';
import { parseEther, parseUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { AbiCoder } from '@ethersproject/abi';
import { injected, useEagerConnect, useInactiveListener } from '../../Utils';
import RelayProxyABI from '../../ABI/RelayProxy.json';
import IERC20ABI from '../../ABI/IERC20.json';
import IDAIABI from '../../ABI/IDAI.json';

const useStyles = makeStyles({
  root: {
    width: 700,
    margin: 20,
    padding: 10,
    overflowWrap: 'anywhere'
  },
  title: {
    fontWeight: 'bold',
  },
  tokenTitle: {
    marginTop: "20px",
  },
  firstAmount: {
    marginRight: 10
  },
  price: {
    marginLeft: 10
  },
  form: {
    marginTop: 20
  },
  submit: {
    width: 100,
    marginTop: 10
  }
});

interface DID {
  did: string;
};

const ApplicationBar: React.FC = () => {
  const context = useWeb3React<Web3Provider>()
  const { active, account, library, activate } = context;
  const classes = useStyles();
  const triedEager = useEagerConnect();
  const [firstAmount, setFirstAmount] = useState("");
  const [price, setPrice] = useState("");
  const [secondAmount, setSecondAmount] = useState("0");
  const [submit, setSubmit] = useState(false);
  
  useInactiveListener(!triedEager);

  const handleChangeAmount = (e: { target: { value: React.SetStateAction<string>; }; }) => {
    setFirstAmount(e.target.value);
  }

  const handleChangePrice = (e: { target: { value: React.SetStateAction<string>; }; }) => {
    setPrice(e.target.value)
  }

  const submitAvailable = () => firstAmount && price;

  const makePermitSignature = async () => {
    if (!active || !submit)
      return;

    const daiAddress = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
    const DAI = new Contract(daiAddress, IDAIABI, library?.getSigner());
    const nonce = await DAI.getNonce(account);
        
    //Make signature
    const typedData = {
      types: {
        Permit: [
          { name: "holder", type: "address" },
          { name: "spender", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "expiry", type: "uint256" },
          { name: "allowed", type: "bool" },
        ],
      },
      domain: {
        name: '(PoS) Dai Stablecoin',
        version: '1',
        salt: hexZeroPad(hexlify(137), 32),
        verifyingContract: daiAddress,
      },
      txData: {
        holder: account,
        spender: process.env.REACT_APP_ADDRESS,
        nonce: nonce,
        expiry: 0,
        allowed: true,
      },
    };
    
    const { domain, types, txData } = typedData;
    let signature = await library?.getSigner()._signTypedData(domain, types, txData);
    signature = signature?.split('x')[1] as string;

    let r = '0x' + signature.substring(0, 64);
    let s = '0x' + signature.substring(64, 128);
    let v = parseInt('0x' + signature.substring(128, 130));
    if (v < 27)
      v += 27;
    
    //send signature to backend
    let response = await axios.post('http://localhost:3001/api/permit', {
      ...txData,
      signature: { sigR: r, sigS: s, sigV: v}
    })
    console.log(response);
  }

  const makeSignatureAndSend = async () => {
    if (!active || !submit)
      return;

    await makePermitSignature();

    const relayProxy = new Contract(process.env.REACT_APP_ADDRESS as string, RelayProxyABI, library?.getSigner())
    const _nonce = await relayProxy.getNonce(account);
    const moduleAddress = "0x5A36178E38864F5E724A2DaF5f9cD9bA473f7903";
    const daiAddress = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
    const usdtAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
    const randomSecret = hexlify(randomBytes(19)).replace("0x", "");
    // 0x67656c61746f6e6574776f726b = gelatonetwork in hex
    const fullSecret = `0x67656c61746f6e6574776f726b${randomSecret}`;
    const { privateKey: secret, address: witness } = new Wallet(fullSecret);
    const inputAmount = parseEther(firstAmount);
    const outputAmount = parseUnits(secondAmount, 6);
    const gelatoFeeBPS = 2;
    const slippageBPS = 40;    
    const gelatoFee = BigNumber.from(outputAmount)
      .mul(gelatoFeeBPS)
      .div(10000)
      .gte(1)
      ? BigNumber.from(outputAmount)
          .mul(gelatoFeeBPS)
          .div(10000)
      : BigNumber.from(1);
    const slippage = BigNumber.from(outputAmount).mul(slippageBPS).div(10000);
    const minReturn = BigNumber.from(outputAmount).sub(gelatoFee).sub(slippage);
    const abiEncoder = new AbiCoder();
    const encodedData = abiEncoder.encode(
      ["address", "uint256"],
      [usdtAddress, minReturn]
    );

    //Make signature
    const typedData = {
      types: {
        MetaTransaction: [
          { name: 'nonce', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
          { name: 'secret', type: 'bytes32' },
          { name: 'module', type: 'address' },
          { name: 'inputToken', type: 'address' },
          { name: 'owner', type: 'address' },
          { name: 'witness', type: 'address' },
          { name: 'data', type: 'bytes' },
        ],
      },
      domain: {
        name: 'DepositToken',
        version: '1',
        chainId: 1337,
        verifyingContract: process.env.REACT_APP_ADDRESS,
      },
      txData: {
        nonce: _nonce,
        amount: inputAmount,
        secret: secret,
        module: moduleAddress,
        inputToken: daiAddress,
        owner: account,
        witness: witness,
        data: encodedData
      },
    };
    
    const { domain, types, txData } = typedData;
    let signature = await library?.getSigner()._signTypedData(domain, types, txData);
    signature = signature?.split('x')[1] as string;

    let r = '0x' + signature.substring(0, 64);
    let s = '0x' + signature.substring(64, 128);
    let v = parseInt('0x' + signature.substring(128, 130));
    if (v < 27)
      v += 27;
    
    const { nonce, ...rest } = txData;
    //send signature to backend
    let response = await axios.post('http://localhost:3001/api/order', {
      ...rest,
      signature: { sigR: r, sigS: s, sigV: v}
    })
    console.log(response);

    setSubmit(false);
  };

  const handleSubmit = async () => {
    try {
      await activate(injected)
    } catch (ex) {
      console.log(ex)
    }

    setSubmit(true);
  }

  useEffect(() => {
    if (submitAvailable())
      setSecondAmount((parseFloat(firstAmount) * parseFloat(price)).toString());
    else
      setSecondAmount("0");
  }, [firstAmount, price]);

  useEffect(() => {
    makeSignatureAndSend();
  }, [submit])

  return (
    <Card className={classes.root}>
      <CardContent>
        <Typography className={classes.title} variant="h5">Limit Order</Typography>
        <Typography className={classes.tokenTitle} variant="subtitle1">Token1: WMATIC</Typography>
        <TextField 
          id="first-amount" 
          type="number"
          data-testid="first-amount" 
          className={classes.firstAmount} 
          label="Amount" 
          variant="standard" 
          value={firstAmount}
          onChange={handleChangeAmount}/>
        <TextField 
          id="price" 
          type="number"
          data-testid="price" 
          className={classes.price} 
          label="Price" 
          variant="standard" 
          onChange={handleChangePrice}/>
        <Typography className={classes.tokenTitle} variant="subtitle1">Token2: USDT</Typography>
        <Typography data-testid="second-amount" variant="subtitle1">Amount: {secondAmount}</Typography>
        
        <FormGroup className={classes.form}>
          <Button 
            className={classes.submit} 
            variant="contained" 
            color="primary" 
            data-testid="submit"
            disabled={submitAvailable() ? false : true}
            onClick={handleSubmit}>
              SUBMIT
          </Button>
        </FormGroup>
      </CardContent>
    </Card>
  );
};

export default ApplicationBar;