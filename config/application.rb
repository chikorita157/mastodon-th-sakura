# frozen_string_literal: true

require_relative 'boot'

require 'rails'

require 'active_record/railtie'
# require 'active_storage/engine'
require 'action_controller/railtie'
require 'action_view/railtie'
require 'action_mailer/railtie'
require 'active_job/railtie'
# require 'action_cable/engine'
# require 'action_mailbox/engine'
# require 'action_text/engine'
# require 'rails/test_unit/railtie'

# Used to be implicitly required in action_mailbox/engine
require 'mail'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

require_relative '../lib/exceptions'
require_relative '../lib/sanitize_ext/sanitize_config'
require_relative '../lib/redis/namespace_extensions'
require_relative '../lib/paperclip/url_generator_extensions'
require_relative '../lib/paperclip/attachment_extensions'
require_relative '../lib/paperclip/lazy_thumbnail'
require_relative '../lib/paperclip/gif_transcoder'
require_relative '../lib/paperclip/media_type_spoof_detector_extensions'
require_relative '../lib/paperclip/transcoder'
require_relative '../lib/paperclip/type_corrector'
require_relative '../lib/paperclip/response_with_limit_adapter'
require_relative '../lib/terrapin/multi_pipe_extensions'
require_relative '../lib/mastodon/snowflake'
require_relative '../lib/mastodon/version'
require_relative '../lib/mastodon/rack_middleware'
require_relative '../lib/public_file_server_middleware'
require_relative '../lib/devise/strategies/two_factor_ldap_authenticatable'
require_relative '../lib/devise/strategies/two_factor_pam_authenticatable'
require_relative '../lib/chewy/settings_extensions'
require_relative '../lib/chewy/index_extensions'
require_relative '../lib/chewy/strategy/mastodon'
require_relative '../lib/chewy/strategy/bypass_with_warning'
require_relative '../lib/webpacker/manifest_extensions'
require_relative '../lib/webpacker/helper_extensions'
require_relative '../lib/rails/engine_extensions'
require_relative '../lib/active_record/database_tasks_extensions'
require_relative '../lib/active_record/batches'
require_relative '../lib/simple_navigation/item_extensions'
require_relative '../lib/http_extensions'

require_relative '../lib/treehouse/automod'

Dotenv::Railtie.load

Bundler.require(:pam_authentication) if ENV['PAM_ENABLED'] == 'true'

require_relative '../lib/mastodon/redis_config'

module Mastodon
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.0

    config.active_record.marshalling_format_version = 7.1

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    # config.autoload_lib(ignore: %w(assets tasks templates generators))
    # TODO: We should enable this eventually, but for now there are many things
    # in the wrong path from the perspective of zeitwerk.

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    # config.paths.add File.join('app', 'api'), glob: File.join('**', '*.rb')
    # config.autoload_paths += Dir[Rails.root.join('app', 'api', '*')]

    config.active_job.queue_adapter = :sidekiq

    config.action_mailer.deliver_later_queue_name = 'mailers'
    config.action_mailer.preview_paths << Rails.root.join('spec', 'mailers', 'previews')

    # We use our own middleware for this
    config.public_file_server.enabled = false

    config.middleware.use PublicFileServerMiddleware if Rails.env.local? || ENV['RAILS_SERVE_STATIC_FILES'] == 'true'
    config.middleware.use Rack::Attack
    config.middleware.use Mastodon::RackMiddleware

    initializer :deprecator do |app|
      app.deprecators[:mastodon] = ActiveSupport::Deprecation.new('4.3', 'mastodon/mastodon')
    end

    config.to_prepare do
      Doorkeeper::AuthorizationsController.layout 'modal'
      Doorkeeper::AuthorizedApplicationsController.layout 'admin'
      Doorkeeper::Application.include ApplicationExtension
      Doorkeeper::AccessToken.include AccessTokenExtension
      Devise::FailureApp.include AbstractController::Callbacks
      Devise::FailureApp.include Localized
    end

    config.x.th_automod.automod_account_username = ENV['TH_STAFF_ACCOUNT']
    config.x.th_automod.account_service_heuristic_auto_suspend_active = ENV.fetch('TH_ACCOUNT_SERVICE_HEURISTIC_AUTO_SUSPEND', '') == 'that-one-spammer'
    config.x.th_automod.mention_spam_heuristic_auto_limit_active = ENV.fetch('TH_MENTION_SPAM_HEURISTIC_AUTO_LIMIT_ACTIVE', '') == 'can-spam'
    config.x.th_automod.mention_spam_threshold =
      begin
        value = ENV.fetch('TH_MENTION_SPAM_THRESHOLD', '0').to_i
        value == 0 ? Float::INFINITY : value
      end
    config.x.th_automod.min_account_age_threshold = ENV.fetch('TH_MIN_ACCOUNT_AGE_THRESHOLD', '2').to_i.days
  end
end
