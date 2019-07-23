import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export default class DisplayName extends React.PureComponent {

  static propTypes = {
    account: ImmutablePropTypes.map,
    className: PropTypes.string,
    inline: PropTypes.bool,
    localDomain: PropTypes.string,
    others: ImmutablePropTypes.list,
    handleClick: PropTypes.func,
  };

  render() {
    const { account, className, inline, localDomain, others, onAccountClick } = this.props;

    const computedClass = classNames('display-name', { inline }, className);

    if (!account) return null;

    let displayName, suffix;

    let acct = account.get('acct');

    if (acct.indexOf('@') === -1 && localDomain) {
      acct = `${acct}@${localDomain}`;
    }

    if (others && others.size > 0) {
      displayName = others.take(2).map(a => (
        <a
          href={a.get('url')}
          target='_blank'
          onClick={(e) => onAccountClick(a.get('id'), e)}
          title={`@${a.get('acct')}`}
        >
          <bdi key={a.get('id')}>
            <strong className='display-name__html' dangerouslySetInnerHTML={{ __html: a.get('display_name_html') }} />
          </bdi>
        </a>
      )).reduce((prev, cur) => [prev, ', ', cur]);

      if (others.size - 2 > 0) {
       displayName.push(` +${others.size - 2}`);
      }

      suffix = (
        <a href={account.get('url')} target='_blank' onClick={(e) => onAccountClick(account.get('id'), e)}>
          <span className='display-name__account'>@{acct}</span>
        </a>
      );
    } else {
      displayName = <bdi><strong className='display-name__html' dangerouslySetInnerHTML={{ __html: account.get('display_name_html') }} /></bdi>;
      suffix      = <span className='display-name__account'>@{acct}</span>;
    }

    return (
      <span className={computedClass}>
        {displayName}
        {inline ? ' ' : null}
        {suffix}
      </span>
    );
  }

}
