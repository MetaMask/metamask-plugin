import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import MaterialTextField from '@material-ui/core/TextField';

const inputLabelBase = {
  transform: 'none',
  transition: 'none',
  position: 'initial',
  color: '#5b5b5b',
};

const styles = {
  materialLabel: {
    '&$materialFocused': {
      color: '#aeaeae',
    },
    '&$materialError': {
      color: '#aeaeae',
    },
    'fontWeight': '400',
    'color': '#aeaeae',
  },
  materialFocused: {},
  materialUnderline: {
    '&:after': {
      borderBottom: `2px solid rgb(3, 125, 214)`,
    },
  },
  materialError: {},
  materialWhitePaddedRoot: {
    color: '#aeaeae',
  },
  materialWhitePaddedInput: {
    'padding': '8px',

    '&::placeholder': {
      color: '#aeaeae',
    },
  },
  materialWhitePaddedFocused: {
    color: '#fff',
  },
  materialWhitePaddedUnderline: {
    '&:after': {
      borderBottom: '2px solid #fff',
    },
  },
  // Non-material styles
  formLabel: {
    '&$formLabelFocused': {
      color: '#5b5b5b',
    },
    '&$materialError': {
      color: '#5b5b5b',
    },
  },
  formLabelFocused: {},
  inputFocused: {},
  inputRoot: {
    'label + &': {
      marginTop: '9px',
    },
    'border': '1px solid #BBC0C5',
    'height': '48px',
    'borderRadius': '6px',
    'padding': '0 16px',
    'display': 'flex',
    'alignItems': 'center',
    '&$inputFocused': {
      border: '1px solid #2f9ae0',
    },
  },
  largeInputLabel: {
    ...inputLabelBase,
    fontSize: '1rem',
  },
  inputLabel: {
    ...inputLabelBase,
    fontSize: '.75rem',
  },
  inputMultiline: {
    lineHeight: 'initial !important',
  },
};

const getMaterialThemeInputProps = ({
  dir,
  classes: { materialLabel, materialFocused, materialError, materialUnderline },
  startAdornment,
  min,
  max,
  autoComplete,
}) => ({
  InputLabelProps: {
    classes: {
      root: materialLabel,
      focused: materialFocused,
      error: materialError,
    },
  },
  InputProps: {
    startAdornment,
    classes: {
      underline: materialUnderline,
    },
    inputProps: {
      dir,
      min,
      max,
      autoComplete,
    },
  },
});

const getMaterialWhitePaddedThemeInputProps = ({
  dir,
  classes: {
    materialWhitePaddedRoot,
    materialWhitePaddedFocused,
    materialWhitePaddedInput,
    materialWhitePaddedUnderline,
  },
  startAdornment,
  min,
  max,
  autoComplete,
}) => ({
  InputProps: {
    startAdornment,
    classes: {
      root: materialWhitePaddedRoot,
      focused: materialWhitePaddedFocused,
      input: materialWhitePaddedInput,
      underline: materialWhitePaddedUnderline,
    },
    inputProps: {
      dir,
      min,
      max,
      autoComplete,
    },
  },
});

const getBorderedThemeInputProps = ({
  dir,
  classes: {
    formLabel,
    formLabelFocused,
    materialError,
    largeInputLabel,
    inputLabel,
    inputRoot,
    input,
    inputFocused,
  },
  largeLabel,
  startAdornment,
  min,
  max,
  autoComplete,
}) => ({
  InputLabelProps: {
    shrink: true,
    className: largeLabel ? largeInputLabel : inputLabel,
    classes: {
      root: formLabel,
      focused: formLabelFocused,
      error: materialError,
    },
  },
  InputProps: {
    startAdornment,
    disableUnderline: true,
    classes: {
      root: inputRoot,
      input,
      focused: inputFocused,
    },
    inputProps: {
      dir,
      min,
      max,
      autoComplete,
    },
  },
});

const themeToInputProps = {
  'material': getMaterialThemeInputProps,
  'bordered': getBorderedThemeInputProps,
  'material-white-padded': getMaterialWhitePaddedThemeInputProps,
};

const TextField = ({
  error,
  classes,
  theme,
  startAdornment,
  largeLabel,
  dir,
  min,
  max,
  autoComplete,
  ...textFieldProps
}) => {
  const inputProps = themeToInputProps[theme]({
    classes,
    startAdornment,
    largeLabel,
    dir,
    min,
    max,
    autoComplete,
  });

  return (
    <MaterialTextField
      error={Boolean(error)}
      helperText={error}
      {...inputProps}
      {...textFieldProps}
    />
  );
};

TextField.defaultProps = {
  error: null,
  dir: 'auto',
  theme: 'bordered',
};

TextField.propTypes = {
  error: PropTypes.string,
  classes: PropTypes.object,
  dir: PropTypes.string,
  theme: PropTypes.oneOf(['bordered', 'material', 'material-white-padded']),
  startAdornment: PropTypes.element,
  largeLabel: PropTypes.bool,
  min: PropTypes.number,
  max: PropTypes.number,
  autoComplete: PropTypes.string,
};

export default withStyles(styles)(TextField);
