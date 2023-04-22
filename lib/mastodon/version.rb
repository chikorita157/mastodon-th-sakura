# frozen_string_literal: true

module Mastodon
  module Version
    module_function

    def major
      4
    end

    def minor
      1
    end

    def patch
      0
    end

    def flags
      ''
    end

    def suffix
      '+glitch.th'
    end

    def to_a
      [major, minor, patch].compact
    end

    def to_s
      [to_a.join('.'), flags, suffix].join
    end

    def repository
      ENV.fetch('GIT_REPOSITORY', false) || ENV.fetch('GITHUB_REPOSITORY', false) || 'treehouse/mastodon'
    end

    def source_base_url
      base = ENV['GITHUB_REPOSITORY'] ? 'https://github.com' : 'https://gitea.treehouse.systems'
      ENV.fetch('SOURCE_BASE_URL', "#{base}/#{repository}")
    end

    # specify git tag or commit hash here
    def source_tag
      tag = ENV.fetch('SOURCE_TAG', nil)
      return if tag.nil? || tag.empty?
      tag
    end

    def source_url
      tag = source_tag
      if tag && source_base_url =~ /gitea/
        suffix = if !tag[/\H/]
                   "commit/#{tag}"
                 else
                   "branch/#{tag}"
                 end
        "#{source_base_url}/#{suffix}"
      else
        source_base_url
      end
    end

    def user_agent
      @user_agent ||= "#{HTTP::Request::USER_AGENT} (Mastodon/#{Version}; +http#{Rails.configuration.x.use_https ? 's' : ''}://#{Rails.configuration.x.web_domain}/)"
    end
  end
end
