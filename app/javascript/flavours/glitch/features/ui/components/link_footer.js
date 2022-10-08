import { connect } from 'react-redux';
import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { version, repository, source_url, profile_directory as profileDirectory } from 'flavours/glitch/initial_state';
import { logOut } from 'flavours/glitch/utils/log_out';
import { openModal } from 'flavours/glitch/actions/modal';
import { PERMISSION_INVITE_USERS } from 'flavours/glitch/permissions';

const messages = defineMessages({
  logoutMessage: { id: 'confirmations.logout.message', defaultMessage: 'Are you sure you want to log out?' },
  logoutConfirm: { id: 'confirmations.logout.confirm', defaultMessage: 'Log out' },
});

const mapDispatchToProps = (dispatch, { intl }) => ({
  onLogout () {
    dispatch(openModal('CONFIRM', {
      message: intl.formatMessage(messages.logoutMessage),
      confirm: intl.formatMessage(messages.logoutConfirm),
      closeWhenConfirm: false,
      onConfirm: () => logOut(),
    }));
  },
});

export default @injectIntl
@connect(null, mapDispatchToProps)
class LinkFooter extends React.PureComponent {

  static contextTypes = {
    identity: PropTypes.object,
  };

  static propTypes = {
    onLogout: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
  };

  handleLogoutClick = e => {
    e.preventDefault();
    e.stopPropagation();

    this.props.onLogout();
 
    return false;
  }

  render () {
    const { signedIn, permissions } = this.context.identity;
    const items = [];

    items.push(<a key='apps' href='https://joinmastodon.org/apps' target='_blank'><FormattedMessage id='navigation_bar.apps' defaultMessage='Get the app' /></a>);
    items.push(<a key='about' href='/about/more' target='_blank'><FormattedMessage id='navigation_bar.info' defaultMessage='About' /></a>);
    items.push(<a key='mastodon' href='https://joinmastodon.org' target='_blank'><FormattedMessage id='getting_started.what_is_mastodon' defaultMessage='About Mastodon' /></a>);
    items.push(<a key='docs' href='https://docs.joinmastodon.org' target='_blank'><FormattedMessage id='getting_started.documentation' defaultMessage='Documentation' /></a>);
    items.push(<Link key='privacy-policy' to='/privacy-policy'><FormattedMessage id='getting_started.privacy_policy' defaultMessage='Privacy Policy' /></Link>);
    items.push(<Link key='hotkeys' to='/keyboard-shortcuts'><FormattedMessage id='navigation_bar.keyboard_shortcuts' defaultMessage='Hotkeys' /></Link>);

    if (profileDirectory) {
      items.push(<Link key='directory' to='/directory'><FormattedMessage id='getting_started.directory' defaultMessage='Directory' /></Link>);
    }

    if (signedIn) {
      if ((permissions & PERMISSION_INVITE_USERS) === PERMISSION_INVITE_USERS) {
        items.push(<a key='invites' href='/invites' target='_blank'><FormattedMessage id='getting_started.invite' defaultMessage='Invite people' /></a>);
      }

      items.push(<a key='security' href='/auth/edit'><FormattedMessage id='getting_started.security' defaultMessage='Security' /></a>);
      items.push(<a key='logout' href='/auth/sign_out' onClick={this.handleLogoutClick}><FormattedMessage id='navigation_bar.logout' defaultMessage='Logout' /></a>);
    }

    return (
      <div className='getting-started__footer'>
        <ul>
          {items.map((item, index, array) => (
            <li>{item} { index === array.length - 1 ? null : ' · ' }</li>
          ))}
        </ul>

        <p>
          <FormattedMessage
            id='getting_started.open_source_notice'
            defaultMessage='Glitchsoc is open source software, a friendly fork of {Mastodon}. You can contribute or report issues on GitHub at {github}.'
            values={{
              github: <span><a href={source_url} rel='noopener noreferrer' target='_blank'>{repository}</a> (v{version})</span>,
              Mastodon: <a href='https://github.com/tootsuite/mastodon' rel='noopener noreferrer' target='_blank'>Mastodon</a> }}
          />
        </p>
      </div>
    );
  }

};
