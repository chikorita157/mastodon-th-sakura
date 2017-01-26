import PureRenderMixin from 'react-addons-pure-render-mixin';
import ImmutablePropTypes from 'react-immutable-proptypes';

const outerStyle = {
  display: 'flex',
  cursor: 'pointer',
  fontSize: '14px',
  border: '1px solid #363c4b',
  borderRadius: '4px',
  color: '#616b86',
  marginTop: '14px',
  textDecoration: 'none',
  overflow: 'hidden'
};

const contentStyle = {
  flex: '1 1 auto',
  padding: '8px',
  paddingLeft: '14px',
  overflow: 'hidden'
};

const titleStyle = {
  display: 'block',
  fontWeight: '500',
  marginBottom: '5px',
  color: '#d9e1e8',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};

const descriptionStyle = {
  color: '#d9e1e8'
};

const imageOuterStyle = {
  flex: '0 0 100px',
  background: '#373b4a'
};

const imageStyle = {
  display: 'block',
  width: '100%',
  height: 'auto',
  margin: '0',
  borderRadius: '4px 0 0 4px'
};

const hostStyle = {
  display: 'block',
  marginTop: '5px',
  fontSize: '13px'
};

const getHostname = url => {
  const parser = document.createElement('a');
  parser.href = url;
  return parser.hostname;
};

const Card = React.createClass({
  propTypes: {
    card: ImmutablePropTypes.map
  },

  mixins: [PureRenderMixin],

  render () {
    const { card } = this.props;

    if (card === null) {
      return null;
    }

    let image = '';

    if (card.get('image')) {
      image = (
        <div style={imageOuterStyle}>
          <img src={card.get('image')} alt={card.get('title')} style={imageStyle} />
        </div>
      );
    }

    return (
      <a style={outerStyle} href={card.get('url')} className='status-card'>
        {image}

        <div style={contentStyle}>
          <strong style={titleStyle} title={card.get('title')}>{card.get('title')}</strong>
          <p style={descriptionStyle}>{card.get('description').substring(0, 50)}</p>
          <span style={hostStyle}>{getHostname(card.get('url'))}</span>
        </div>
      </a>
    );
  }
});

export default Card;
