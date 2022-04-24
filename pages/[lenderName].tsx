import { useRouter } from 'next/router';
import { Grid, TextField, Button, Snackbar, Select, MenuItem, Checkbox, FormHelperText, FormControl } from '@material-ui/core';
import { NextPage } from 'next';
import React, { useState, useEffect } from 'react';
import { LenderFields, LenderGetResponse, LenderGetResponseExtended } from 'lib/types';
import { css, cx } from '@emotion/css'

const LenderNamePage: NextPage = () => {
  const router = useRouter();
  const lenderSlug = router.query.lenderName?.toString();
  const [bankData, setBankData] = useState<LenderGetResponse | LenderGetResponseExtended>({name: "", fields: []})
  const [formValues, setFormValues] = useState({})
  const [decision, setDecision] = useState(null);
  const [invalidInputs, setInvalidInputs] = useState<any>([])
  const [openDecisionSnackbar, setOpenDecisionSnackbar] = useState(false);

  const [acceptedMessage, setAcceptedMessage] = useState("")
  const [declinedMessage, setDeclinedMessage] = useState("")


  useEffect(() => {
    if (lenderSlug !== undefined) {
      fetch('/api/lenders/'+ lenderSlug)
      .then(result => result.json())
      .then(data => {
        setBankData(data)
        if (lenderSlug == "naboo-bank") {
          setFormValues(data.fields.reduce((obj: Object, cur: LenderFields) => ({...obj, [cur.name]: {type: cur.type, required: cur.required, options: cur.options, value: cur.type == "checkbox" ? false: ""}}), {}))
          setInvalidInputs(data.fields.filter((field: LenderFields) => field.required).reduce((obj: Array<string>, cur: LenderFields) =>  ([...obj, cur.name]), []))
        }
        else {
          setFormValues(data.fields.reduce((obj: Object, cur: string) => ({...obj, [cur]: {type: "text", required: false, value: ""}}), {}))
        }
      })
      if (lenderSlug === "bank-of-azeroth"){
        setAcceptedMessage("For Azeroth!")
        setDeclinedMessage("From light comes darkness and from darkness light.")
      }
      else if (lenderSlug === "middle-earth-bank"){
        setAcceptedMessage("Fly, you fools!")
        setDeclinedMessage("You shall not pass!")
      }
      else if (lenderSlug === "naboo-bank"){
        setAcceptedMessage("Do. Or do not. There is no try.")
        setDeclinedMessage("These aren’t the droids you’re looking for.")
      }
    }
    
  }, [lenderSlug])

  const formatFieldsString = (field:string) => (field.charAt(0).toUpperCase() + field.slice(1)).replaceAll("_", " ")

  const handleInputChange = (event: any) => {
    setFormValues( (values) => ({
      ...values,
      [event.target.name] : {
        ...values[event.target.name as keyof Object],
        value: event.target.type === "checkbox" ? event.target.checked : event.target.value
      }
    }))

    if (invalidInputs.includes(event.target.name) && event.target.value !== "") {
      const invalids = invalidInputs.filter( (name: string) => name != event.target.name)
      setInvalidInputs(invalids)
    }
  }

  const handleSubmit = () => {
    const data = {}
    Object.entries(formValues).map( ([name, field]: any) => {
      data[name as keyof Object] = field.value
    })

    fetch('/api/lenders/' + lenderSlug, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
      setDecision(data.decision)
      setOpenDecisionSnackbar(true)
    });
  };

  return <>
  <Grid 
    container 
    xs={10} 
    spacing={6}
    direction="column"
    alignItems="center"
    className={
      css`
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: #ebedeb;
      border: 3px solid #545754;
      padding: 32px;
      font-size: 20px;
      border-radius: 8px;
      `}>
    <Grid item xs={12} className={css`font-size: 48px;`}>
      {bankData && bankData.name}
    </Grid>
    <Grid 
      item 
      container 
      xs={12} 
      spacing={4}
      direction="column"
      alignItems="center"
    >
      {formValues &&  
        Object.entries(formValues).map(([name, field]: any) => 
        <Grid container item spacing={1} key={name} direction="row" justify="center" alignItems="center">
          <Grid item xs={3}>{formatFieldsString(name)}</Grid> 
          <Grid item xs={2}>
            {field.type == "text" &&
              <TextField 
              fullWidth
              variant="standard"
              size="small"
              name={name} 
              value={field.value} 
              required={field.required} 
              error={field.required === true && field.value === ""} 
              helperText={field.required === true && field.value === "" ? "required" : ""}
              onChange={handleInputChange}
            />
            }
            {field.type == "select" &&
              <FormControl fullWidth size="small">
                <Select
                name={name}
                value={field.value}
                required={field.required}
                error={field.required === true && field.value === ""}
                onChange={handleInputChange}
                >
                  {field.options.map( (option: string, index: number) => 
                  <MenuItem key={index} value={option}>{option}</MenuItem>)}
                </Select>
                {field.required === true && field.value === "" && 
                <FormHelperText 
                  error={field.required === true && field.value === ""}
                >required</FormHelperText>}
            </FormControl>
            }
            {field.type == "checkbox" && 
            <Checkbox 
              color="primary"
              name={name}
              checked={field.value}
              required={field.required}
              onChange={handleInputChange} 
            />}
          </Grid>
        </Grid>
        )
      }
    </Grid>
      <Grid item xs={12}>
        <Button color="primary" size="large" variant="contained" disabled={invalidInputs.length !== 0} onClick={handleSubmit}>Submit</Button>
      </Grid>
      <Grid item xs={12}>
        {decision === "accepted" &&
        <p>{acceptedMessage}</p>}
        {decision === "declined" &&
        <p>{declinedMessage}</p>}
      </Grid>
  </Grid>
  <Snackbar
    open={openDecisionSnackbar}
    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    autoHideDuration={5000}
    message={decision}
    onClose={() => setOpenDecisionSnackbar(false)}
  />
  </>;
};

export default LenderNamePage;
