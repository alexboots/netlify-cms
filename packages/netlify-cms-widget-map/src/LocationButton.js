import React from 'react';
import PropTypes from 'prop-types';
import { ClassNames } from '@emotion/core';
import styled from '@emotion/styled';
import { colors, buttons } from 'netlify-cms-ui-default';

const StyledLocationButton = styled.button`
  ${buttons.button};
  ${buttons.default};
  ${props => props.buttonType}
`;

export const LocationButton = (props) => {
  const buttonType = props.actionType === 'add' ? buttons.green : buttons.red;
  const buttonText = props.actionType === 'add' ? 'Add' : 'Remove';
  return(
    <ClassNames>
      {({ cx, css }) => (
        <p className={cx(css`
            color: ${colors.text};
            margin-top: 20px;
          `)}
        >
          <StyledLocationButton buttonType={buttonType}>
            {buttonText}
          </StyledLocationButton>
          <span className={(css`margin-left: 10px;`)}>
            {props.location.label}
          </span>
        </p>
      )}
    </ClassNames>
  )
}

LocationButton.propTypes = {
  actionType: PropTypes.string.isRequired,
  location: PropTypes.object,
}
