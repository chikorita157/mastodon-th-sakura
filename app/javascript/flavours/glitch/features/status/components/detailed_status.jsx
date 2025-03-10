import PropTypes from 'prop-types';

import { FormattedDate } from 'react-intl';

import classNames from 'classnames';
import { Link, withRouter } from 'react-router-dom';

import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';


import RepeatIcon from '@/material-icons/400-24px/repeat.svg?react';
import StarIcon from '@/material-icons/400-24px/star-fill.svg?react';
import { AnimatedNumber } from 'flavours/glitch/components/animated_number';
import AttachmentList from 'flavours/glitch/components/attachment_list';
import EditedTimestamp from 'flavours/glitch/components/edited_timestamp';
import { getHashtagBarForStatus } from 'flavours/glitch/components/hashtag_bar';
import { Icon }  from 'flavours/glitch/components/icon';
import PictureInPicturePlaceholder from 'flavours/glitch/components/picture_in_picture_placeholder';
import { VisibilityIcon } from 'flavours/glitch/components/visibility_icon';
import PollContainer from 'flavours/glitch/containers/poll_container';
import { WithRouterPropTypes } from 'flavours/glitch/utils/react_router';

import { Avatar } from '../../../components/avatar';
import { DisplayName } from '../../../components/display_name';
import MediaGallery from '../../../components/media_gallery';
import StatusContent from '../../../components/status_content';
import StatusReactions from '../../../components/status_reactions';
import Audio from '../../audio';
import scheduleIdleTask from '../../ui/util/schedule_idle_task';
import Video from '../../video';

import Card from './card';

class DetailedStatus extends ImmutablePureComponent {

  static contextTypes = {
    identity: PropTypes.object,
  };

  static propTypes = {
    status: ImmutablePropTypes.map,
    settings: ImmutablePropTypes.map.isRequired,
    onOpenMedia: PropTypes.func.isRequired,
    onOpenVideo: PropTypes.func.isRequired,
    onToggleHidden: PropTypes.func,
    onTranslate: PropTypes.func.isRequired,
    expanded: PropTypes.bool,
    measureHeight: PropTypes.bool,
    onHeightChange: PropTypes.func,
    domain: PropTypes.string.isRequired,
    compact: PropTypes.bool,
    showMedia: PropTypes.bool,
    pictureInPicture: ImmutablePropTypes.contains({
      inUse: PropTypes.bool,
      available: PropTypes.bool,
    }),
    onToggleMediaVisibility: PropTypes.func,
    onReactionAdd: PropTypes.func.isRequired,
    onReactionRemove: PropTypes.func.isRequired,
    ...WithRouterPropTypes,
  };

  state = {
    height: null,
  };

  handleAccountClick = (e) => {
    if (e.button === 0 && !(e.ctrlKey || e.altKey || e.metaKey) && this.props.history) {
      e.preventDefault();
      this.props.history.push(`/@${this.props.status.getIn(['account', 'acct'])}`);
    }

    e.stopPropagation();
  };

  parseClick = (e, destination) => {
    if (e.button === 0 && !(e.ctrlKey || e.altKey || e.metaKey) && this.props.history) {
      e.preventDefault();
      this.props.history.push(destination);
    }

    e.stopPropagation();
  };

  handleOpenVideo = (options) => {
    this.props.onOpenVideo(this.props.status.getIn(['media_attachments', 0]), options);
  };

  _measureHeight (heightJustChanged) {
    if (this.props.measureHeight && this.node) {
      scheduleIdleTask(() => this.node && this.setState({ height: Math.ceil(this.node.scrollHeight) + 1 }));

      if (this.props.onHeightChange && heightJustChanged) {
        this.props.onHeightChange();
      }
    }
  }

  setRef = c => {
    this.node = c;
    this._measureHeight();
  };

  componentDidUpdate (prevProps, prevState) {
    this._measureHeight(prevState.height !== this.state.height);
  }

  handleChildUpdate = () => {
    this._measureHeight();
  };

  handleModalLink = e => {
    e.preventDefault();

    let href;

    if (e.target.nodeName !== 'A') {
      href = e.target.parentNode.href;
    } else {
      href = e.target.href;
    }

    window.open(href, 'mastodon-intent', 'width=445,height=600,resizable=no,menubar=no,status=no,scrollbars=yes');
  };

  handleTranslate = () => {
    const { onTranslate, status } = this.props;
    onTranslate(status);
  };

  render () {
    const status = (this.props.status && this.props.status.get('reblog')) ? this.props.status.get('reblog') : this.props.status;
    const outerStyle = { boxSizing: 'border-box' };
    const { compact, pictureInPicture, expanded, onToggleHidden, settings } = this.props;

    if (!status) {
      return null;
    }

    let applicationLink = '';
    let reblogLink = '';
    const reblogIcon = 'retweet';
    const reblogIconComponent = RepeatIcon;
    let favouriteLink = '';
    let edited = '';

    //  Depending on user settings, some media are considered as parts of the
    //  contents (affected by CW) while other will be displayed outside of the
    //  CW.
    let contentMedia = [];
    let contentMediaIcons = [];
    let extraMedia = [];
    let extraMediaIcons = [];
    let media = contentMedia;
    let mediaIcons = contentMediaIcons;

    if (settings.getIn(['content_warnings', 'media_outside'])) {
      media = extraMedia;
      mediaIcons = extraMediaIcons;
    }

    if (this.props.measureHeight) {
      outerStyle.height = `${this.state.height}px`;
    }

    const language = status.getIn(['translation', 'language']) || status.get('language');

    if (pictureInPicture.get('inUse')) {
      media.push(<PictureInPicturePlaceholder />);
      mediaIcons.push('video-camera');
    } else if (status.get('media_attachments').size > 0) {
      if (status.get('media_attachments').some(item => item.get('type') === 'unknown')) {
        media.push(<AttachmentList media={status.get('media_attachments')} />);
      } else if (status.getIn(['media_attachments', 0, 'type']) === 'audio') {
        const attachment = status.getIn(['media_attachments', 0]);
        const description = attachment.getIn(['translation', 'description']) || attachment.get('description');

        media.push(
          <Audio
            src={attachment.get('url')}
            alt={description}
            lang={language}
            duration={attachment.getIn(['meta', 'original', 'duration'], 0)}
            poster={attachment.get('preview_url') || status.getIn(['account', 'avatar_static'])}
            backgroundColor={attachment.getIn(['meta', 'colors', 'background'])}
            foregroundColor={attachment.getIn(['meta', 'colors', 'foreground'])}
            accentColor={attachment.getIn(['meta', 'colors', 'accent'])}
            sensitive={status.get('sensitive')}
            visible={this.props.showMedia}
            blurhash={attachment.get('blurhash')}
            height={150}
            onToggleVisibility={this.props.onToggleMediaVisibility}
          />,
        );
        mediaIcons.push('music');
      } else if (status.getIn(['media_attachments', 0, 'type']) === 'video') {
        const attachment = status.getIn(['media_attachments', 0]);
        const description = attachment.getIn(['translation', 'description']) || attachment.get('description');

        media.push(
          <Video
            preview={attachment.get('preview_url')}
            frameRate={attachment.getIn(['meta', 'original', 'frame_rate'])}
            blurhash={attachment.get('blurhash')}
            src={attachment.get('url')}
            alt={description}
            lang={language}
            inline
            sensitive={status.get('sensitive')}
            letterbox={settings.getIn(['media', 'letterbox'])}
            fullwidth={settings.getIn(['media', 'fullwidth'])}
            preventPlayback={!expanded}
            onOpenVideo={this.handleOpenVideo}
            autoplay
            visible={this.props.showMedia}
            onToggleVisibility={this.props.onToggleMediaVisibility}
          />,
        );
        mediaIcons.push('video-camera');
      } else {
        media.push(
          <MediaGallery
            standalone
            sensitive={status.get('sensitive')}
            media={status.get('media_attachments')}
            lang={language}
            letterbox={settings.getIn(['media', 'letterbox'])}
            fullwidth={settings.getIn(['media', 'fullwidth'])}
            hidden={!expanded}
            onOpenMedia={this.props.onOpenMedia}
            visible={this.props.showMedia}
            onToggleVisibility={this.props.onToggleMediaVisibility}
          />,
        );
        mediaIcons.push('picture-o');
      }
    } else if (!status.get('quote') && status.get('card')) {
      media.push(<Card sensitive={status.get('sensitive')} onOpenMedia={this.props.onOpenMedia} card={status.get('card')} />);
      mediaIcons.push('link');
    }

    if (status.get('poll')) {
      contentMedia.push(<PollContainer pollId={status.get('poll')} lang={status.get('language')} />);
      contentMediaIcons.push('tasks');
    }

    if (status.get('application')) {
      applicationLink = <> · <a className='detailed-status__application' href={status.getIn(['application', 'website'])} target='_blank' rel='noopener noreferrer'>{status.getIn(['application', 'name'])}</a></>;
    }

    const visibilityLink = <> · <VisibilityIcon visibility={status.get('visibility')} /></>;

    if (!['unlisted', 'public'].includes(status.get('visibility'))) {
      reblogLink = null;
    } else if (this.props.history) {
      reblogLink = (
        <>
          {' · '}
          <Link to={`/@${status.getIn(['account', 'acct'])}/${status.get('id')}/reblogs`} className='detailed-status__link'>
            <Icon id={reblogIcon} icon={reblogIconComponent} />
            <span className='detailed-status__reblogs'>
              <AnimatedNumber value={status.get('reblogs_count')} />
            </span>
          </Link>
        </>
      );
    } else {
      reblogLink = (
        <>
          {' · '}
          <a href={`/interact/${status.get('id')}?type=reblog`} className='detailed-status__link' onClick={this.handleModalLink}>
            <Icon id={reblogIcon} icon={reblogIconComponent} />
            <span className='detailed-status__reblogs'>
              <AnimatedNumber value={status.get('reblogs_count')} />
            </span>
          </a>
        </>
      );
    }

    if (this.props.history) {
      favouriteLink = (
        <Link to={`/@${status.getIn(['account', 'acct'])}/${status.get('id')}/favourites`} className='detailed-status__link'>
          <Icon id='star' icon={StarIcon} />
          <span className='detailed-status__favorites'>
            <AnimatedNumber value={status.get('favourites_count')} />
          </span>
        </Link>
      );
    } else {
      favouriteLink = (
        <a href={`/interact/${status.get('id')}?type=favourite`} className='detailed-status__link' onClick={this.handleModalLink}>
          <Icon id='star' icon={StarIcon} />
          <span className='detailed-status__favorites'>
            <AnimatedNumber value={status.get('favourites_count')} />
          </span>
        </a>
      );
    }

    if (status.get('edited_at')) {
      edited = (
        <>
          {' · '}
          <EditedTimestamp statusId={status.get('id')} timestamp={status.get('edited_at')} />
        </>
      );
    }

    const {statusContentProps, hashtagBar} = getHashtagBarForStatus(status);
    contentMedia.push(hashtagBar);

    return (
      <div style={outerStyle}>
        <div ref={this.setRef} className={classNames('detailed-status', `detailed-status-${status.get('visibility')}`, { compact })} data-status-by={status.getIn(['account', 'acct'])}>
          <a href={status.getIn(['account', 'url'])} onClick={this.handleAccountClick} className='detailed-status__display-name'>
            <div className='detailed-status__display-avatar'><Avatar account={status.get('account')} size={48} /></div>
            <DisplayName account={status.get('account')} localDomain={this.props.domain} />
          </a>

          <StatusContent
            status={status}
            media={contentMedia}
            extraMedia={extraMedia}
            mediaIcons={contentMediaIcons}
            expanded={expanded}
            collapsed={false}
            onExpandedToggle={onToggleHidden}
            onTranslate={this.handleTranslate}
            parseClick={this.parseClick}
            onUpdate={this.handleChildUpdate}
            tagLinks={settings.get('tag_misleading_links')}
            rewriteMentions={settings.get('rewrite_mentions')}
            disabled
            {...statusContentProps}
          />

          <StatusReactions
            statusId={status.get('id')}
            reactions={status.get('reactions')}
            addReaction={this.props.onReactionAdd}
            removeReaction={this.props.onReactionRemove}
            canReact={this.context.identity.signedIn}
          />

          <div className='detailed-status__meta'>
            <a className='detailed-status__datetime' href={status.get('url')} target='_blank' rel='noopener noreferrer'>
              <FormattedDate value={new Date(status.get('created_at'))} hour12={false} year='numeric' month='short' day='2-digit' hour='2-digit' minute='2-digit' />
            </a>{edited}{visibilityLink}{applicationLink}{reblogLink} · {favouriteLink}
          </div>
        </div>
      </div>
    );
  }

}

export default withRouter(DetailedStatus);
