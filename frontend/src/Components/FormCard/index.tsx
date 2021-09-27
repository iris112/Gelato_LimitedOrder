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
import { injected, useEagerConnect, useInactiveListener } from '../../Utils';
import RelayProxyABI from '../../ABI/RelayProxy.json';
import Web3 from 'web3';

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

  const makeSignature = async () => {
    if (!active || !submit)
      return;

    const relayProxy = new Contract(process.env.REACT_APP_ADDRESS as string, RelayProxyABI, library?.getSigner())
    const nonce = await relayProxy.getNonce(account);
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
        nonce: nonce,
        amount: 10,
        secret: "0x1234567812345678123456781234567812345678123456781234567812345678",
        module: process.env.REACT_APP_MODULE,
        inputToken: process.env.REACT_APP_INPUT_TOKEN,
        owner: account,
        witness: process.env.REACT_APP_WITNESS,
        data: "0xFFFFFFFFFFFFFFFFFFFFFF"
      },
    };
    
    const { domain, types, txData } = typedData;
    var signature = await library?.getSigner()._signTypedData(domain, types, txData);
    signature = signature?.split('x')[1] as string;

    var r = '0x' + signature.substring(0, 64);
    var s = '0x' + signature.substring(64, 128);
    var v = parseInt('0x' + signature.substring(128, 130));
    if (v < 27)
      v += 27;
        
    setSubmit(false);

    await relayProxy.executeLimitOrder(
      txData.amount,
      txData.secret,
      txData.module,
      txData.inputToken,
      txData.owner,
      txData.witness,
      txData.data,
      r,
      s,
      v
    );
  };

  const handleSubmit = async () => {
    // axios.post('/api/vc', {
    //   firstName,
    //   lastName,
    //   subjectDID
    // })
    // .then((response: AxiosResponse) => {
    //   setVC(response.data.vc);
    // })
    // .catch((error) => {
    //   console.log(error);
    // });

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
    makeSignature();
  }, [submit])

  return (
    <Card className={classes.root}>
      <CardContent>
        <Typography className={classes.title} variant="h5">Limit Order</Typography>
        <Typography className={classes.tokenTitle} variant="subtitle1">Token1: MATIC</Typography>
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