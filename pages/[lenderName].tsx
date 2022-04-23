import { useRouter } from 'next/router';
import { Grid, TextField, Button, Snackbar, Select, MenuItem, Checkbox } from '@material-ui/core';
import { NextPage } from 'next';
import React, { useState, useEffect } from 'react';
import { LenderFields, LenderGetResponse, LenderGetResponseExtended } from 'lib/types';

const LenderNamePage: NextPage = () => {
  const router = useRouter();
  const lenderSlug = router.query.lenderName?.toString();
  const [bankData, setBankData] = useState<LenderGetResponse | LenderGetResponseExtended>({name: "", fields: []})
  const [formValues, setFormValues] = useState({})
  const [decision, setDecision] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  console.log(formValues)

  useEffect(() => {
    if (lenderSlug != undefined)
      fetch('/api/lenders/'+ lenderSlug)
      .then(result => result.json())
      .then(data => {
        setBankData(data)
        if (lenderSlug == "naboo-bank") // better way to do this?
          setFormValues(data.fields.reduce((obj: Object, cur: LenderFields) => ({...obj, [cur.name]: {type: cur.type, required: cur.required, options: cur.options, value: cur.type == "checkbox" ? false: ""}}), {}))
        else
          setFormValues(data.fields.reduce((obj: Object, cur: string) => ({...obj, [cur]: {type: "text", required:"false", value: ""}}), {}))
      })
  }, [lenderSlug])

  const formatFieldsString = (field:string) => (field.charAt(0).toUpperCase() + field.slice(1)).replace("_", " ")

  
  const handleInputChange = (event: any) => {
    setFormValues( (values) => ({
      ...values,
      [event.target.name] : {
        ...values[event.target.name],
        value: event.target.checked? event.target.checked : event.target.value
      }
    }))
  }

  const handleSubmit = () => {
    fetch('/api/lenders/' + lenderSlug, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formValues)
    })
    .then(response => response.json())
    .then(data => {
      setDecision(data.decision)
      setOpenSnackbar(true)
    });
  };

  
  return <Grid container spacing={6}>
    <Grid item xs={12}>
      {bankData && bankData.name}
    </Grid>
    <Grid item container xs={12} spacing={2}>
      {formValues &&  
        Object.entries(formValues).map(([name, field]:any) => 
        <Grid container item spacing={1} key={name}>
          <Grid item xs={6}>{formatFieldsString(name)}</Grid> 
          {field.type == "text" &&
            <TextField variant="standard" name={name} value={field.value} onChange={handleInputChange}/>}
          {field.type == "select" &&
            <Select
            name={name}
            value={field.value}
            label={formatFieldsString(name)}
            onChange={handleInputChange}
          >
            {field.options.map( (option:string, index) => 
            <MenuItem key={index} value={option}>{option}</MenuItem>)}
          </Select>
          }
          {field.type == "checkbox" && 
          <Checkbox 
            name={name}
            checked={field.value}
            onChange={handleInputChange} 
          />}
          <Grid item xs={6}>
          </Grid>
        </Grid>
        )
      }
    </Grid>;
    <Grid item xs={12}>
      <Button variant="contained" onClick={handleSubmit}>Submit</Button>
    </Grid>
    <Snackbar
      open={openSnackbar}
      autoHideDuration={6000}
      message={decision}
    />
    </Grid>;
};

export default LenderNamePage;
