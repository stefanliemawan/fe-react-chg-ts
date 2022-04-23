import { useRouter } from 'next/router';
import { Grid, TextField, Button, Snackbar, Select, MenuItem, Checkbox } from '@material-ui/core';
import { NextPage } from 'next';
import React, { useState, useEffect } from 'react';
import { LenderFields, LenderGetResponse, LenderGetResponseExtended } from 'lib/types';

// TODO - add validation (required) and beautify


const LenderNamePage: NextPage = () => {
  const router = useRouter();
  const lenderSlug = router.query.lenderName?.toString();
  const [bankData, setBankData] = useState<LenderGetResponse | LenderGetResponseExtended>({name: "", fields: []})
  const [formValues, setFormValues] = useState({})
  const [decision, setDecision] = useState(null);
  const [invalidInputs, setInvalidInputs] = useState<any>([])
  const [openDecisionSnackbar, setOpenDecisionSnackbar] = useState(false);


  useEffect(() => {
    if (lenderSlug !== undefined)
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
  }, [lenderSlug])

  const formatFieldsString = (field:string) => (field.charAt(0).toUpperCase() + field.slice(1)).replace("_", " ")

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

  return <Grid container spacing={6}>
    <Grid item xs={12}>
      {bankData && bankData.name}
    </Grid>
    <Grid item container xs={12} spacing={2}>
      {formValues &&  
        Object.entries(formValues).map(([name, field]: any) => 
        <Grid container item spacing={1} key={name}>
          <Grid item xs={6}>{formatFieldsString(name)}</Grid> 
          {field.type == "text" &&
            <TextField 
            variant="standard"
            name={name} 
            value={field.value} 
            required={field.required} 
            error={field.required === true && field.value === ""} 
            helperText={field.required === true && field.value === "" ? "required" : ""}
            onChange={handleInputChange}
          />
          }
          {field.type == "select" &&
            <Select
            name={name}
            value={field.value}
            label={formatFieldsString(name)}
            required={field.required}
            error={field.required === true && field.value === ""}
            onChange={handleInputChange}
          >
            {field.options.map( (option: string, index: number) => 
            <MenuItem key={index} value={option}>{option}</MenuItem>)}
          </Select>
          }
          {field.type == "checkbox" && 
          <Checkbox 
            name={name}
            checked={field.value}
            required={field.required}
            onChange={handleInputChange} 
          />}
          <Grid item xs={6}>
          </Grid>
        </Grid>
        )
      }
    </Grid>;
    <Grid item xs={12}>
      <Button variant="contained" disabled={invalidInputs.length !== 0} onClick={handleSubmit}>Submit</Button>
    </Grid>
    <Snackbar
      open={openDecisionSnackbar}
      autoHideDuration={3000}
      message={decision}
      onClose={() => setOpenDecisionSnackbar(false)}
    />
    </Grid>;
};

export default LenderNamePage;
